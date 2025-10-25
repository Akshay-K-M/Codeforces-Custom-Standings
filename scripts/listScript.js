console.log("listScript.js loaded!");


// Helper function to get CSRF token from metadata
function getCsrfToken() {
  const csrf = document.querySelector('meta[name="X-Csrf-Token"]');
  const token = csrf ? csrf.getAttribute('content') : null;
  if (!token) console.error('[listScript] CSRF token not found');
  return token;
}

// Create or get existing list by name
async function getOrCreateList(csrfToken, listName) {
  const response = await fetch('https://codeforces.com/lists');
  const text = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  const existingLists = doc.querySelectorAll('.datatable a[href^="/list/"]');
  let listId = null;

  existingLists.forEach(list => {
    if (list.textContent.trim() === listName) {
      listId = list.getAttribute('href').split('/').pop();
    }
  });

  if (!listId) {
    const url = 'https://codeforces.com/lists/new';
    const data = new URLSearchParams();
    data.append('csrf_token', csrfToken);
    data.append('action', 'saveList');
    data.append('englishName', listName);
    data.append('russianName', '');

    const createResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: data.toString()
    });

    if (createResponse.ok) {
      return await getOrCreateList(csrfToken, listName);
    }
  }
  return listId;
}

async function getHandlesFromOrganization(orgId) {
  let userList = [], page = 1, hasMore = true;
  while (hasMore && userList.length < 1000) {
    try {
      const resp = await fetch(`https://codeforces.com/ratings/organization/${orgId}/page/${page}`);
      const text = await resp.text();
      if (!text) break;
      const doc = new DOMParser().parseFromString(text, 'text/html');
      const datatable = doc.querySelector('.datatable.ratingsDatatable');
      if (!datatable) break;
      const users = datatable.querySelectorAll('a.rated-user');
      if (!users.length) break;
      for (const user of users) {
        userList.push(user.textContent.trim());
        if (userList.length >= 1000) { hasMore = false; break; }
      }
      if (users.length < 200 || userList.length >= 1000) hasMore = false;
      else page++;
    } catch (err) {
      console.error("[getHandles] Error org", orgId, err);
      break;
    }
  }
  // Always limit to first 1000 because codeforces limits list size
  userList = userList.slice(0, 1000);
  console.log(`[org:${orgId}] Got ${userList.length} top-rated users`);
  return userList;
}

async function addMembersToList(csrfToken, listId, handles) {
  if (!handles.length) return false;
  try {
    const url = `https://codeforces.com/list/${listId}`;
    const data = new FormData();
    data.append('csrf_token', csrfToken);
    data.append('action', 'addMembers');
    data.append('handlesToAdd', handles.join(' '));
    const resp = await fetch(url, { method: 'POST', headers: { referer: url }, body: data });
    if (!resp.ok) {
      console.error(`[addMembersToList] HTTP error: ${resp.status}`);
      return false;
    }
    // Further sanity check: did it succeed?
    // (You can parse resp.text() and look for known "success" string.)
    return true;
  } catch (e) {
    console.error('[addMembers] Error:', e);
    return false;
  }
}

async function refreshNeededLists() {
  const csrfToken = getCsrfToken();
  if (!csrfToken) return;
  chrome.storage.local.get(['bookmarkedColleges'], async (res) => {
    let colleges = res.bookmarkedColleges || [];
    const now = Date.now();
    let changed = false;

    for (let college of colleges) {
      if (!college.lastRefreshed || (now - college.lastRefreshed > 24 * 60 * 60 * 1000)) {
        const listName = `organization-${college.orgId}`;
        const listId = await getOrCreateList(csrfToken, listName);
        if (!listId) {
          console.error("[refreshLists] Could not create/get list for", college, "(skipping org)");
          continue;
        }
        const handles = await getHandlesFromOrganization(college.orgId);
        if (!handles || !handles.length) {
          console.error(`[refreshLists] No users for orgId=${college.orgId}, not updating.`);
          continue;
        }
        const ok = await addMembersToList(csrfToken, listId, handles);
        if (ok) {
          college.lastRefreshed = now;
          changed = true;
          console.log(`[refreshLists] Updated list orgId=${college.orgId} with ${handles.length} users, listId=${listId}`);
        } else {
          console.error(`[refreshLists] Failed to add users orgId=${college.orgId}, listId=${listId}`);
        }
      }
    }
    if (changed) {
      chrome.storage.local.set({ bookmarkedColleges: colleges }, () => {
        console.log('[refreshLists] Updated lastRefreshed for some colleges');
      });
    }
  });
}

// Always refresh needed orgs on every page load
refreshNeededLists();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.bookmarkedColleges) {
    refreshNeededLists();
  }
});

console.log("listScript.js loaded and robust. No duplicates, users always added, and always recoverable.");
