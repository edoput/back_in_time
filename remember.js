// A -> B
// link B.id to A.url
var previous_tab = new Map();
// link B.url to A.id
var origin_id = new Map();
// link A.id to B.url
var origin_url = new Map();

var url_filter = {
  url: [
    { urlMatches: /.*/ }
  ]
};

var create_options = {
  active: true,
  url: ''
};

// details:
// - sourceTabId
// - url
function prepareTabOrigin (details) {
  // integer: The ID of the tab in which the navigation originated
  var source_tab_id = details.sourceTabId;
  // save where we are and our id
  // save (A.id, A.url)
  chrome.tabs.get(source_tab_id, (tabA) => { origin_url.set(source_tab_id, tabA.url) });
  // string. B.url
  var target_url = details.url;
  // save (B.url, A.id)
  origin_id.set(target_url, source_tab_id)
}

// details:
// - tabId
// - url
function rememberTabOrigin (details) {
  // integer: The ID of the tab in which the navigation is about to occur
  var tab_id = details.tabId;
  // string. The URL to which the given frame will navigate.
  var target_url = details.url;
  // B.url -> A.id
  var source_tab_id = origin_id.get(target_url);
  // does the source tab exists?
  if (source_tab_id) {
    // set the previous url
    // save (B.id, A.url)
    previous_tab.set(tab_id, origin_url.get(source_tab_id));
    console.log(previous_tab.get(tab_id));
  }
}

function resurrectTab () {
  chrome.tabs.query({active: true }, (query_list) => {
    var tabB = query_list[0];
    if (tabB) {
      create_options.url = previous_tab.get(tabB.id);
      chrome.tabs.create(create_options);
    }
  });
}


chrome.webNavigation.onCreatedNavigationTarget.addListener(prepareTabOrigin)
chrome.webNavigation.onBeforeNavigate.addListener(rememberTabOrigin)
