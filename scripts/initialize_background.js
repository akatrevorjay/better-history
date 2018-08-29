(function() {
load = function() {
  var browserActions = new BH.Chrome.BrowserActions({
    chrome : chrome,
  });
  browserActions.listen();

  var omnibox = new BH.Chrome.Omnibox({
    chrome : chrome,
  });
  omnibox.listen();

  window.selectionContextMenu = new BH.Chrome.SelectionContextMenu({
    chrome : chrome,
  });

  window.pageContextMenu = new BH.Chrome.PageContextMenu({
    chrome : chrome,
  });
  pageContextMenu.listenToTabs();

  new ChromeSync().get('settings', function(data) {
    var settings = data.settings || {};

    if (settings.searchBySelection !== false) {
      selectionContextMenu.create();
    }

    if (settings.searchByDomain !== false) {
      pageContextMenu.create();
    }
  });
};

if (BH.config.env === 'prod') {
  try {
    load();
  } catch (e) {
    console.log.error(e);
  }
} else {
  load();
}
})();
