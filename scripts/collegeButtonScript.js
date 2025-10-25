console.log("contentScript.js loaded!");

function addCollegeStandingsTab() {
  chrome.storage.local.get(['defaultCollegeListId'], (result) => {
    const defaultListId = result.defaultCollegeListId;

    if (!defaultListId) {
      console.log('[contentScript] No default college list ID found');
      return;
    }

    const tabContainer = document.getElementsByClassName('second-level-menu-list')[0];
    if (!tabContainer) {
      console.log('[contentScript] Tab container not found (not a contest page)');
      return;
    }

    // Check if already added
    if (document.getElementById('cf-college-standings-tab')) {
      return;
    }

    const currentUrl = window.location.href;
    const contestIdMatch = currentUrl.match(/\/contest\/(\d+)/);
    if (!contestIdMatch) return;

    const contestId = contestIdMatch[1];
    const standingsUrl = `https://codeforces.com/contest/${contestId}/standings?list=${defaultListId}`;

    // Create "College Standings" tab
    const customTab = document.createElement('li');
    customTab.id = 'cf-college-standings-tab';
    customTab.innerHTML = `<a href="${standingsUrl}"><span>College Standings</span></a>`;

    const friendsStandingsTab = tabContainer.querySelector('a[href*="standings/friends"]');
    if (friendsStandingsTab) {
      friendsStandingsTab.parentNode.insertAdjacentElement('afterend', customTab);
    } else {
      tabContainer.appendChild(customTab);
    }

    console.log('[contentScript] College Standings tab added');

    // Highlight tab if viewing college standings (check for ?list= in URL)
    const currentListIdMatch = currentUrl.match(/standings\?list=([^&]+)/);
    if (currentListIdMatch) {
      // Multiple rounds of highlighting to override Codeforces's JS
      const highlightTab = () => {
        const tabs = tabContainer.querySelectorAll('li');
        tabs.forEach(tab => tab.classList.remove('current', 'selectedLava'));
        customTab.classList.add('current', 'selectedLava');
      };
      
      // Immediate highlight
      highlightTab();
      
      // Re-highlight after short delays (to override CF's JS)
      setTimeout(highlightTab, 100);
      setTimeout(highlightTab, 300);
      setTimeout(highlightTab, 500);
      
      console.log('[contentScript] College Standings tab highlighted (multiple times)');
    }
  });
}

addCollegeStandingsTab();
