(function() {
var SearchView = BH.Views.MainView.extend({
  className : 'search_view with_controls',
  template : 'search.html',

  events : {
    'click .fresh_search' : 'clickedFreshSearch',
    'click .search_deeper' : 'clickedSearchDeeper',
    'keyup .search' : 'onSearchTyped',
    'blur .search' : 'onSearchBlurred'
  },

  initialize : function() {
    this.collection.on('reset', this.onHistoryChanged, this);
    this.model.on('change:query', this.onQueryChanged, this);
    this.model.on('change:cacheDatetime', this.onCacheChanged, this);
  },

  render : function() {
    var presenter = new BH.Presenters.SearchPresenter(this.model.toJSON());
    var properties = _.extend(this.getI18nValues(), presenter.searchInfo());
    var template = BH.Lib.Template.fetch(this.template);
    var html = Mustache.to_html(template, properties);
    this.$el.append(html);

    this.searchControlsView = new BH.Views.SearchControlsView({
      model : this.model,
      collection : this.collection,
      el : this.$('.search_controls')
    });
    this.searchControlsView.render();

    return this;
  },

  pageTitle : function() { return BH.Chrome.I18n.t('searching_title'); },

  onHistoryChanged : function() {
    this.$el.removeClass('loading');
    this.renderVisits();
    this.assignTabIndices('.visit a.item');
  },

  onCacheChanged : function() {
    if (this.model.get('cacheDatetime')) {
      var datetime = moment(this.model.get('cacheDatetime'));
      var date = datetime.format(BH.Chrome.I18n.t('extended_formal_date'));
      var time = datetime.format(BH.Chrome.I18n.t('local_time'));
      this.$('.cached .datetime').text(time + " " + date);
      this.$('.cached').show();
    } else {
      this.$('.cached').hide();
    }
  },

  onQueryChanged : function() {
    this.searchControlsView.render();
    if (this.model.get('query')) {
      this.$('.cached').hide();
      this.$el.addClass('loading');

      var presenter = new BH.Presenters.SearchPresenter(this.model.toJSON());
      var properties = presenter.searchInfo();
      this.$('.title').text(properties.title);
      this.$('.visits_content').html('');
    }
  },

  clickedFreshSearch : function(ev) {
    ev.preventDefault();
    new Historian.Search().expireCache();
    this.$('.visits_content').html('');
    this.$('.cached').hide();
    this.$('.pagination').html('');
    this.$el.addClass('loading');

    this.searchControlsView.page.set({page : 1});
    Backbone.history.loadUrl(Backbone.history.fragment);
  },

  clickedSearchDeeper : function(ev) {
    ev.preventDefault();

    this.$('.number_of_visits').html('');
    this.$('.search_deeper').addClass('searching');
    this.$('.pagination').html('');
    this.$el.addClass('loading');

    this.searchDeeper();
  },

  searchDeeper : function() {
    // This is a shitty solution
    this.deepSearched = true;

    var options = {startAtResult : 5001, maxResults : 0};

    var _this = this;
    new Historian.Search(this.model.get('query'))
        .fetch(options, function(history) {
          _this.$('.search_deeper').hide();
          _this.collection.add(history);
          _this.$el.removeClass('loading');
        });
  },

  renderVisits : function() {
    this.$el.removeClass('loading');
    this.$('.search').focus();

    this.$('.visits_content').addClass('disappear');
    var _this = this;
    setTimeout(function() {
      _this.$('.visits_content').html('');
      if (_this.searchResultsView) {
        _this.searchResultsView.undelegateEvents();
      }

      _this.searchResultsView = new BH.Views.SearchResultsView({
        query : _this.model.get('query'),
        collection : _this.collection,
        el : _this.$('.visits_content'),
        page : _this.searchControlsView.page,
        deepSearched : _this.deepSearched
      });
      _this.$('.visits_content').removeClass('disappear');

      _this.searchResultsView.render();

      _this.delay = 50;
    }, this.delay || 0);
  },

  getI18nValues : function() {
    return BH.Chrome.I18n.t(
        [ 'search_input_placeholder_text', 'no_visits_found' ]);
  }
});

BH.Views.SearchView = SearchView;
})();
