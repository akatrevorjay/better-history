(function() {
var getDomain = function(url) {
  var match = url.match(/\w+:\/\/(.*?)\//);
  if (match) {
    return match[1].replace('www.', '');
  }
  return false;
};

var PageContextMenu = function(options) {
  if (!options.chrome) {
    throw ("Chrome API not set");
  }

  this.chromeAPI = options.chrome;

  this.id = 'better_history_page_context_menu';
};

PageContextMenu.prototype.create = function() {
  this.menu = this.chromeAPI.contextMenus.create({
    title : this.chromeAPI.i18n.getMessage('visits_to_domain', [ 'domain' ]),
    contexts : [ 'page' ],
    id : this.id
  });

  var _this = this;
  this.chromeAPI.contextMenus.onClicked.addListener(function(
      data) { _this.onClick(data); });
};

PageContextMenu.prototype.onClick = function(data) {
  if (data.menuItemId === this.id) {
    var domain = getDomain(data.pageUrl);

    url = "chrome://history/#search";
    if (domain) {
      url += '/' + domain;
    }

    this.chromeAPI.tabs.create({url : url});
  }
};

PageContextMenu.prototype.updateTitleDomain = function(tab) {
  if (tab) {
    var domain = getDomain(tab.url);
    if (domain) {
      this.chromeAPI.contextMenus.update(this.menu, {
        title : this.chromeAPI.i18n.getMessage('visits_to_domain', [ domain ])
      });
    }
  }
};

PageContextMenu.prototype.listenToTabs = function() {
  if (this.chromeAPI.tabs) {
    var _this = this;

    if (this.chromeAPI.tabs.onActivated) {
      this.chromeAPI.tabs.onActivated.addListener(function(tabInfo) {
        if (_this.menu) {
          _this.onTabSelectionChanged(tabInfo.tabId);
        }
      });
    }

    if (this.chromeAPI.tabs.onUpdated) {
      this.chromeAPI.tabs.onUpdated.addListener(function(tabId, changedInfo,
                                                         tab) {
        if (_this.menu) {
          _this.onTabUpdated(tab);
        }
      });
    }
  }
};

PageContextMenu.prototype.onTabSelectionChanged = function(tabId) {
  var _this = this;
  this.chromeAPI.tabs.get(tabId,
                          function(tab) { _this.updateTitleDomain(tab); });
};

PageContextMenu.prototype.onTabUpdated = function(tab) {
  if (tab && tab.selected) {
    this.updateTitleDomain(tab);
  }
};

PageContextMenu.prototype.remove = function() {
  this.chromeAPI.contextMenus.remove(this.menu);
  delete (this.menu);
};

BH.Chrome.PageContextMenu = PageContextMenu;
})();
