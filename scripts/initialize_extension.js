(function() {
var load = function() {
  Historian.setWorkerPath('bower_components/chrome-historian/src/workers/');

  if (chrome && chrome.i18n && chrome.i18n.getUILanguage) {
    BH.lang = chrome.i18n.getUILanguage();
  }

  Settings = Backbone.Model.extend({
    defaults : {
      searchBySelection : true,
      searchByDomain : true,
      use24HourClock : false
    }
  });

  var settings = new Settings();
  new ChromeSync().get('settings',
                       function(props) { settings.set(props.settings); });

  window.router = new BH.Router({
    settings : settings,
  });

  Backbone.history.start();

  // BH.Modals.MailingListModal.prompt(function() {
  //   new BH.Modals.MailingListModal().open();
  // });
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
