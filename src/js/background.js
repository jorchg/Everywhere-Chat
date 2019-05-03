chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, ([currentTab]) => {
    chrome.storage.local.set({
      currentTab: JSON.stringify(currentTab),
      currentDomain: (new URL(currentTab.url)).hostname,
    });
  });
});
