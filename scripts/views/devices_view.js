(function() {
var DevicesView = BH.Views.MainView.extend({
  className : 'devices_view with_controls',

  template : 'devices.html',

  events :
      {'keyup .search' : 'onSearchTyped', 'blur .search' : 'onSearchBlurred'},

  initialize : function() {
    this.collection.on('reset', this.onCollectionReset, this);

    this.model = new Backbone.Model();

    this.feature = new Backbone.Model({supported : true});
    this.feature.on('change:supported', this.onFeatureSupportedChange, this);
  },

  pageTitle : function() { return BH.Chrome.I18n.t('devices_title'); },

  render : function() {
    var properties =
        _.extend(this.getI18nValues(), {devices : this.collection.toJSON()});
    var template = BH.Lib.Template.fetch(this.template);
    var html = Mustache.to_html(template, properties);
    this.$el.append(html);

    var devicesResultsView = new BH.Views.DevicesResultsView({
      model : this.model,
      collection : new Backbone.Collection(),
      el : this.$('.content')
    });

    return this;
  },

  onCollectionReset : function() {
    this.$('.devices_list_view').remove();

    var devicesListView = new BH.Views.DevicesListView(
        {collection : this.collection, model : this.model});
    this.$('header').append(devicesListView.render().el);

    devicesListView.$('a').eq(0)[0].click();
  },

  onFeatureSupportedChange : function() { this.browserFeatureNotSupported(); },

  getI18nValues : function() {
    return BH.Chrome.I18n.t(
        [ 'devices_title', 'search_input_placeholder_text' ]);
  }
});

BH.Views.DevicesView = DevicesView;
})();
