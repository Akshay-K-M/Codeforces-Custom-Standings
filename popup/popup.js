document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('org-link').addEventListener('click', function(e) {
    e.preventDefault();
    chrome.tabs.create({ url: this.href });
  });
});
