(function() {
var SearchPaginationView = BH.Views.MainView.extend({
  className : 'search_pagination_view',
  template : 'search_pagination.html',

  initialize : function(options) {
    this.query = options.query;
    this.pages = BH.Lib.Pagination.calculatePages(this.collection.length);

    this.collection.on('remove', this.onVisitRemove, this);
    this.collection.on('add', this.onVisitsAdd, this);

    if (this.model.get('page') > this.pages) {
      this.model.set({page : 1});
    }
  },

  events : {'click .pagination a' : 'onPageClicked'},

  render : function() {
    this.pages = BH.Lib.Pagination.calculatePages(this.collection.length);
    this.model.set({totalPages : this.pages});

    var properties = {
      // Hide pagination if there is only one page of results
      paginationClass : (this.pages === 1 ? 'hidden' : ''),
      pages : []
    };

    var _this = this;
    _.range(1, this.pages + 1).forEach(function(i) {
      properties.pages.push({
        url : "#search/" + _this.query + "/p" + i,
        className : (i === _this.model.get('page') ? 'selected' : ''),
        number : i
      });
    });

    var template = BH.Lib.Template.fetch(this.template);
    var html =
        Mustache.to_html(template, _.extend(this.getI18nValues(), properties));
    this.$el.html(html);
  },

  onVisitRemove : function() {
    if (this.collection.length % 100 === 0) {
      this.render();
    } else {
      var copy =
          BH.Chrome.I18n.t('number_of_visits', [ this.collection.length ]);
      this.$('.number_of_visits').text(copy);
    }
  },

  onVisitsAdd : function() { this.render(); },

  onPageClicked : function(ev) {
    ev.preventDefault();
    var $el = $(ev.currentTarget);
    this.$('a').removeClass('selected');
    $el.addClass('selected');
    this.model.set({page : parseInt($el.data('page'), 10)});
  },

  getI18nValues : function() {
    var properties = [];
    properties['i18n_number_of_visits'] =
        BH.Chrome.I18n.t('number_of_visits', [ this.collection.length ]);
    return properties;
  }
});

BH.Views.SearchPaginationView = SearchPaginationView;
})();
