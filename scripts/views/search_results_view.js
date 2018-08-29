(function() {
var SearchResultsView = Backbone.View.extend({
  template : 'search_results.html',

  events : {
    'click .delete_visit' : 'deleteClicked',
    'click .delete_download' : 'deleteDownloadClicked'
  },

  initialize : function(options) {
    this.page = options.page;
    this.query = options.query;
    this.deepSearched = options.deepSearched;
    this.collection.on('add', this.onVisitAdded, this);
    this.page.on('change:page', this.onPageChange, this);
  },

  render : function() {
    var result = BH.Lib.Pagination.calculateBounds(this.page.get('page') - 1);
    var start = result[0];
    var end = result[1];

    var presenter = new BH.Presenters.SearchHistoryPresenter(
        this.collection.toJSON(), this.query);

    var properties = _.extend(this.getI18nValues(), {
      visits : presenter.history(start, end),
      extendSearch : this.page.get('totalPages') === this.page.get('page') &&
                         !this.deepSearched
    });

    var template = BH.Lib.Template.fetch(this.template);
    var html = Mustache.to_html(template, properties);
    this.$el.html(html);

    this.show();
    this.inflateDates();
    this.inflateDownloadIcons();

    document.body.scrollTop = 0;

    return this;
  },

  resetRender : function() {
    this.hide();
    var _this = this;
    setTimeout(function() { _this.$('.visits_content').html(''); }, 250);
  },

  show : function() { this.$el.removeClass('disappear'); },

  hide : function() { this.$el.addClass('disappear'); },

  inflateDates : function() {
    var result = BH.Lib.Pagination.calculateBounds(this.page.get('page') - 1);
    var start = result[0];
    var end = result[1];
    var presenter = new BH.Presenters.SearchHistoryPresenter(
        this.collection.toJSON(), this.query);
    var history = presenter.history(start, end);

    var _this = this;
    $('.visit .datetime').each(function(i, el) {
      _this.inflateDate($(el),
                        history[i].lastVisitTime || history[i].startTime);
    });
  },

  inflateDate : function(
      $el,
      timestamp) { $el.text(new Date(timestamp).toLocaleString(BH.lang)); },

  inflateDownloadIcons : function() {
    var callback = function(el, uri) {
      $(el).find('.description').css({backgroundImage : "url(" + uri + ")"});
    };

    $('.download').each(function(i, el) {
      var downloadId = parseInt($(el).data('download-id'), 10);
      chrome.downloads.getFileIcon(downloadId, {},
                                   function(uri) { callback(el, uri); });
    });
  },

  deleteClicked : function(ev) {
    ev.preventDefault();
    var $el = $(ev.currentTarget);
    var url = $el.data('url');

    var _this = this;
    Historian.deleteUrl(url, function() {
      $el.parents('.visit').remove();
      _this.collection.remove(_this.collection.where({url : url}));
      new Historian.Search().expireCache();
    });
  },

  deleteDownloadClicked : function(ev) {
    ev.preventDefault();
    var $el = $(ev.currentTarget);
    var url = $el.data('url');

    var _this = this;
    Historian.deleteDownload(url, function() {
      $el.parents('.visit').remove();
      _this.collection.remove(_this.collection.where({url : url}));
      new Historian.Search().expireCache();
    });
  },

  onVisitAdded : function(model) {
    if ($('.visits li').length < 100) {
      var visitView = new BH.Views.VisitView({model : model});
      this.$('.visits').append(visitView.render().el);

      this.inflateDate(visitView.$('.datetime'), model.get('lastVisitTime'));
    }
  },

  onPageChange : function() { this.render(); },

  getI18nValues : function() {
    return BH.Chrome.I18n.t([ 'no_visits_found', 'prompt_delete_button' ]);
  }
});
BH.Views.SearchResultsView = SearchResultsView;
})();
