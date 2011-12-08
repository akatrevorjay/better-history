SettingsView = Backbone.View.extend({
  className: 'settings_view',

  events: {
    'click .clear_history': 'clickedClearHistory',
    'click .release_announcement': 'clickedReleaseAnnouncement',
    'click .credits': 'clickedCredits',
    'change .time_grouping': 'changedTimeGrouping',
    'change .time_format': 'changedTimeFormat',
    'click .domain_grouping': 'clickedDomainGrouping',
    'click .search_by_domain': 'clickedSearchByDomain',
    'click .search_by_selection': 'clickedSearchBySelection'
  },

  initialize: function() {
    Helpers.pageTitle('Settings');
    this.model.unbind('change').bind('change', this.saveSettings, this);
  },

  saveSettings: function() {
    this.model.save();
  },

  render: function() {
    var self = this;
    $(this.el).append(ich.settings(i18n.settings())).fadeIn('fast', function() {
      $('.time_grouping', this).val(self.model.get('timeGrouping'));
      $('.time_format', this).val(self.model.get('timeFormat'));
      $('.domain_grouping', this).prop('checked', self.model.get('domainGrouping'));
      $('.search_by_selection', this).prop('checked', self.model.get('searchBySelection'));
      $('.search_by_domain', this).prop('checked', self.model.get('searchByDomain'));
      $('.current_version', this).text(version.get('version'));
    });
    return this;
  },

  changedTimeGrouping: function(ev) {
    this.model.set({timeGrouping: $(ev.currentTarget).val()});
  },

  changedTimeFormat: function(ev) {
    this.model.set({timeFormat: $(ev.currentTarget).val()});
  },

  clickedDomainGrouping: function(ev) {
    this.model.set({domainGrouping: $(ev.currentTarget).is(':checked')});
  },

  clickedSearchByDomain: function(ev) {
    this.model.set({searchByDomain: $(ev.currentTarget).is(':checked')});

    var backgroundPage = chrome.extension.getBackgroundPage(),
        method = (this.model.get('searchByDomain') ? 'create' : 'remove');

    backgroundPage.pageContextMenu[method]();
  },

  clickedSearchBySelection: function(ev) {
    this.model.set({searchBySelection: $(ev.currentTarget).is(':checked')});

    var backgroundPage = chrome.extension.getBackgroundPage(),
        method = (this.model.get('searchBySelection') ? 'create' : 'remove');

    backgroundPage.selectionContextMenu[method]();
  },

  clickedClearHistory: function(ev) {
    ev.preventDefault();
    chrome.tabs.create({url:'chrome://settings/clearBrowserData'});
  },

  clickedReleaseAnnouncement: function(ev) {
    ev.preventDefault();
    versionView.open();
  },

  clickedCredits: function(ev) {
    ev.preventDefault();
    creditsView.open();
  }
});
