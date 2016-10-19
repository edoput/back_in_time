// link B.url to A.url
var previous_url = new Map();
var cleanup = new Map();

// at startup recover previous data
chrome.storage.local.get(loadSavedTabs);

var url_filter = {
  url: [
    { urlMatches: /.*/ }
  ]
};

var create_options = {
  active: true,
  url: ''
};


function loadSavedTabs (item) {
  if (chrome.runtime.lastError) {
    console.log(chrome.runtime.lastError);
  } else {
    previous_url = new Map(item.previous_url);
  }
}

// details:
// - sourceTabId
// - url
function prepareTabOrigin (details) {
  chrome.tabs.get(
    details.sourceTabId,
    (tabA) => {
      previous_url.set(details.url, tabA.url)
      chrome.storage.local.set({
        previous_url: [...previous_url]
      });
    }
  );
}

function prepareCleanUp (details) {
  cleanup.set(details.tabId, details.url);
}

// from tabB look the tabA url, open a new tab
function resurrectTab (tabB) {
  if (tabB) {
    create_options.url = previous_url.get(tabB.url);
    chrome.tabs.create(create_options);
  }
}

// show the page action button when tabB 
// is in previous_tab
function showPageAction (tabId, changeInfo, tabB) {
  if (previous_url.has(tabB.url)) {
    chrome.pageAction.show(tabId);
  } else {
    chrome.pageAction.hide(tabId);
  }
}

function forgetTabOrigin (tabId) {

  if (cleanup.has(tabId)) {
     var stale_url = cleanup.get(tabId);
     cleanup.delete(tabId);

     if (previous_url.has(stale_url)) {
       previous_url.delete(stale_url);
     }
  } else {
     return;
  }
}

// set up the webNavigation events
chrome.webNavigation.onCreatedNavigationTarget.addListener(prepareTabOrigin)
chrome.webNavigation.onCompleted.addListener(prepareCleanUp)

// set up when to show the pageAction
chrome.tabs.onUpdated.addListener(showPageAction);

// link the click to resurrectTab
chrome.pageAction.onClicked.addListener(resurrectTab);

// remove the link when a tab is closed
chrome.tabs.onRemoved.addListener(forgetTabOrigin);
