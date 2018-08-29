(function() {
var Omnibox = function(options) {
  if (!options.chrome) {
    throw ("Chrome API not set");
  }

  this.chromeAPI = options.chrome;
};

Omnibox.prototype.listen = function() {
  if (this.chromeAPI.omnibox) {
    var _this = this;
    this.chromeAPI.omnibox.onInputChanged.addListener(function(
        text, suggest) { _this.setDefaultSuggestion(text); });

    this.chromeAPI.omnibox.onInputEntered.addListener(function(text) {
      _this.getActiveTab(function(tabId) { _this.updateTabURL(tabId, text); });
    });
  }
};

Omnibox.prototype.setDefaultSuggestion = function(text) {
  if (this.chromeAPI.omnibox) {
    this.chromeAPI.omnibox.setDefaultSuggestion(
        {description : "Search <match>" + text + "</match> in history"});
  }
};

Omnibox.prototype.getActiveTab = function(callback) {
  this.chromeAPI.tabs.query({active : true, currentWindow : true},
                            function(tabs) { callback(tabs[0].id); });
};

Omnibox.prototype.updateTabURL = function(tabId, text) {
  this.chromeAPI.tabs.update(tabId, {url : "chrome://history/#search/" + text});
};

BH.Chrome.Omnibox = Omnibox;
})();
