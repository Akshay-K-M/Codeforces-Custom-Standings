console.log("bookmarkScript.js loaded!");

function injectBookmarkCheckbox() {
  const container = document.querySelector('form#locationSelect');
  if (!container) {
    console.error('Bookmark checkbox container not found!');
    return;
  }

  const select = document.querySelector('select[name="organizationId"]');
  if (!select) {
    console.error('Organization select not found!');
    return;
  }
  const selectedOption = select.options[select.selectedIndex];
  const orgId = selectedOption.value;
  const orgName = selectedOption.textContent.trim();

  const label = document.createElement('label');
  label.style.display = "inline-flex";
  label.style.alignItems = "center";
  label.style.marginTop = "0.5em";

  const checkbox = document.createElement('input');
  checkbox.type = "checkbox";
  checkbox.id = "cf-bookmark-college-checkbox";
  label.appendChild(document.createTextNode("Bookmark this college:\u00A0"));
  label.appendChild(checkbox);

  chrome.storage.local.get(['bookmarkedColleges'], (result) => {
    let colleges = result.bookmarkedColleges || [];
    if (colleges.some(c => c.orgId === orgId)) {
      checkbox.checked = true;
    }
  });

  checkbox.addEventListener('change', () => {
    chrome.storage.local.get(['bookmarkedColleges', 'defaultCollegeOrgId', 'defaultCollegeListId'], (result) => {
      let colleges = result.bookmarkedColleges || [];
      const exists = colleges.some(c => c.orgId === orgId);

      if (checkbox.checked && !exists) {
        // Add with listId as null initially (will be set by listScript)
        colleges.push({ orgId, orgName, lastRefreshed: null, listId: null });
        if (colleges.length === 1) {
          chrome.storage.local.set({ defaultCollegeOrgId: orgId, defaultCollegeListId: null });
        }
        chrome.storage.local.set({ bookmarkedColleges: colleges }, () => {
          alert(`Bookmarked college: ${orgName}.`);
        });
      } else if (!checkbox.checked && exists) {
        colleges = colleges.filter(c => c.orgId !== orgId);
        chrome.storage.local.set({ bookmarkedColleges: colleges });
        // Update default if removed org was the default
        if (result.defaultCollegeOrgId === orgId) {
          const newDefault = colleges.length > 0 ? colleges[0].orgId : null;
          const newDefaultListId = colleges.length > 0 ? colleges[0].listId : null;
          chrome.storage.local.set({ defaultCollegeOrgId: newDefault, defaultCollegeListId: newDefaultListId });
        }
      }
    });
  });

  if (!document.getElementById('cf-bookmark-college-checkbox')) {
    container.appendChild(label);
  }
}

injectBookmarkCheckbox();
