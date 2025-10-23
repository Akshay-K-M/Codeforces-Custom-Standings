console.log("bookmarkScript.js loaded!");

function injectBookmarkCheckbox() {
  // Find the target container
  const container = document.querySelector('form#locationSelect');
  if (!container) {
    console.error('Bookmark checkbox container not found!');
    return;
  }

  // Find the college info
  const select = document.querySelector('select[name="organizationId"]');
  if (!select) {
    console.error('Organization select not found!');
    return;
  }
  const selectedOption = select.options[select.selectedIndex];
  const orgId = selectedOption.value;
  const orgName = selectedOption.textContent.trim();

  // Create the checkbox and label
  const label = document.createElement('label');
  label.style.display = "inline-flex";
  label.style.alignItems = "center";
  label.style.marginTop = "0.5em"; // For bottom placement

  const checkbox = document.createElement('input');
  checkbox.type = "checkbox";
  checkbox.id = "cf-bookmark-college-checkbox";
  label.appendChild(document.createTextNode("Bookmark this college:\u00A0")); // Non-breaking space 
  label.appendChild(checkbox);

  // Load bookmark state and update checkbox
  chrome.storage.local.get(['bookmarkedColleges'], (result) => {
    let colleges = result.bookmarkedColleges || [];
    if (colleges.some(c => c.orgId === orgId)) {
      checkbox.checked = true;
    }
  });

  // Change handler to add/remove bookmark
  checkbox.addEventListener('change', () => {
    chrome.storage.local.get(['bookmarkedColleges', 'defaultCollegeOrgId'], (result) => {
      let colleges = result.bookmarkedColleges || [];
      const exists = colleges.some(c => c.orgId === orgId);

      if (checkbox.checked && !exists) {
        colleges.push({ orgId, orgName, lastRefreshed: null });
        if (colleges.length === 1) {
          chrome.storage.local.set({ defaultCollegeOrgId: orgId });
        }
        chrome.storage.local.set({ bookmarkedColleges: colleges }, () => {
          alert(`Bookmarked college: ${orgName}.`);
        });
      } else if (!checkbox.checked && exists) {
        colleges = colleges.filter(c => c.orgId !== orgId);
        chrome.storage.local.set({ bookmarkedColleges: colleges });
        // Check if removed org is default, update default accordingly
        if (result.defaultCollegeOrgId === orgId) {
          const newDefault = colleges.length > 0 ? colleges[0].orgId : null;
          chrome.storage.local.set({ defaultCollegeOrgId: newDefault });
        }
      }
    });
  });

  // Avoid duplicate checkbox
  if (!document.getElementById('cf-bookmark-college-checkbox')) {
    container.appendChild(label);
  }
}

injectBookmarkCheckbox();
