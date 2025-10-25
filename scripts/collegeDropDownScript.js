console.log("dropdownListScript.js loaded!");

function addCollegeDropdown() {
  // Only run if URL contains ?list=
  const currentUrl = window.location.href;
  if (!currentUrl.includes('standings?list=')) {
    console.log('[dropdownListScript] Not a list standings page, skipping dropdown');
    return;
  }

  chrome.storage.local.get(['bookmarkedColleges'], (result) => {
    const colleges = result.bookmarkedColleges || [];

    if (!colleges.length) {
      console.log('[dropdownListScript] No bookmarked colleges found');
      return;
    }

    const contestIdMatch = currentUrl.match(/\/contest\/(\d+)/);
    if (!contestIdMatch) return;
    const contestId = contestIdMatch[1];

    // Wait for the form to load
    const checkForm = setInterval(() => {
      const targetForm = document.querySelector('form.toggle-show-unofficial');
      if (targetForm) {
        clearInterval(checkForm);
        
        // Check if dropdown already exists
        if (document.getElementById('cf-college-dropdown-container')) {
          return;
        }

        // Create dropdown container DIV
        const dropdownContainer = document.createElement('div');
        dropdownContainer.id = 'cf-college-dropdown-container';
        dropdownContainer.style.cssText = 'margin-top: 0.5em; font-size: 1.0rem;';

        // Create label
        const label = document.createElement('label');
        label.textContent = 'College: ';
        label.style.marginRight = '0.5em';

        // Create dropdown select
        const select = document.createElement('select');
        select.id = 'cf-college-dropdown';
        select.style.cssText = 'padding: 0.3em 0.5em; font-size: 1.0rem;';

        // Get current list ID from URL
        const currentListIdMatch = currentUrl.match(/standings\?list=([^&]+)/);
        const currentListId = currentListIdMatch ? currentListIdMatch[1] : null;

        // Add options for each college
        colleges.forEach((college) => {
          if (!college.listId) return;
          
          const option = document.createElement('option');
          option.value = college.listId;
          option.textContent = college.orgName;
          
          if (college.listId === currentListId) {
            option.selected = true;
          }
          
          select.appendChild(option);
        });

        // Add change event listener to redirect
        select.addEventListener('change', (event) => {
          const selectedListId = event.target.value;
          const newUrl = `https://codeforces.com/contest/${contestId}/standings?list=${selectedListId}`;
          window.location.href = newUrl;
        });

        dropdownContainer.appendChild(label);
        dropdownContainer.appendChild(select);
        targetForm.appendChild(dropdownContainer);

        console.log('[dropdownListScript] College dropdown added below checkbox');
        
        // Force highlight the College Standings tab after dropdown is added
        setTimeout(() => {
          const customTab = document.getElementById('cf-college-standings-tab');
          const tabContainer = document.getElementsByClassName('second-level-menu-list')[0];
          if (customTab && tabContainer) {
            const tabs = tabContainer.querySelectorAll('li');
            tabs.forEach(tab => tab.classList.remove('current', 'selectedLava'));
            customTab.classList.add('current', 'selectedLava');
            console.log('[dropdownListScript] Re-highlighted College Standings tab');
          }
        }, 200);
      }
    }, 100);

    setTimeout(() => clearInterval(checkForm), 5000);
  });
}

addCollegeDropdown();
