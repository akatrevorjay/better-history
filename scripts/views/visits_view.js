(function() {
var VisitsView = BH.Views.MainView.extend({
  className : 'visits_view',

  template : 'visits.html',

  events :
      {'keyup .search' : 'onSearchTyped', 'blur .search' : 'onSearchBlurred'},

  initialize : function() {
    this.collection.on('reset', this.onCollectionReset, this);
    this.model.on('change:date', this.onDateChange, this);

    this.feature = new Backbone.Model({supported : true});
    this.feature.on('change:supported', this.onFeatureSupportedChange, this);
  },

  pageTitle : function() { return 'Activity'; },

  render : function() {
    var template = BH.Lib.Template.fetch(this.template);
    var html = Mustache.to_html(template, this.getI18nValues());
    this.$el.append(html);

    this.timelineView = new BH.Views.TimelineView(
        {model : this.model, el : this.$('.timeline_view')});
    this.timelineView.render();

    this.visitsResultsView = new BH.Views.VisitsResultsView({
      collection : this.collection,
      model : this.model,
      el : this.$('.visits_content')
    });

    return this;
  },

  onDateChange : function(ev) {
    this.timelineView.render();
    this.visitsResultsView.resetRender();
  },

  onCollectionReset : function() {
    this.visitsResultsView.render();
    this.assignTabIndices('.visits > .visit > a.item');
  },

  onFeatureSupportedChange : function() { this.browserFeatureNotSupported(); },

  getI18nValues : function() {
    return BH.Chrome.I18n.t([ 'search_input_placeholder_text' ]);
  }
});

BH.Views.VisitsView = VisitsView;
})();
