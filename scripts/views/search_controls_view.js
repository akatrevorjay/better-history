(function() {
var SearchControlsView = Backbone.View.extend({
  className : 'search_controls_view',
  template : 'search_controls.html',

  events : {
    'click .delete_all' : 'clickedDeleteAll',
    'click #search_tips' : 'clickedSearchTips'
  },

  initialize : function() {
    this.collection.on('reset', this.onHistoryChanged, this);
    this.page = new Backbone.Model({page : 1});
  },

  render : function() {
    var properties = _.extend(this.getI18nValues(), this.model.toJSON());
    var template = BH.Lib.Template.fetch(this.template);
    var html = Mustache.to_html(template, properties);
    this.$el.html(html);
    return this;
  },

  onHistoryChanged : function() {
    var deleteButton = this.$('.delete_all');
    if (this.collection.length === 0 || !this.model.get('query')) {
      deleteButton.attr('disabled', 'disabled');
    } else {
      deleteButton.removeAttr('disabled');
    }

    new BH.Views
        .SearchPaginationView({
          collection : this.collection,
          query : this.model.get('query'),
          el : $('.pagination'),
          model : this.page
        })
        .render();
  },

  clickedDeleteAll : function(ev) {
    ev.preventDefault();
    if ($(ev.target).parent().attr('disabled') !== 'disabled') {
      this.promptView = BH.Modals.CreatePrompt(
          BH.Chrome.I18n.t('confirm_delete_all_search_results'));
      this.promptView.open();
      this.promptView.model.on('change', this.deleteAction, this);
    }
  },

  deleteAction : function(prompt) {
    if (prompt.get('action')) {
      var _this = this;
      new Historian.Search(this.model.get('query')).destroy({}, function() {
        _this.collection.reset([]);
        _this.model.unset('cacheDatetime');
        _this.promptView.close();
      });
    } else {
      this.promptView.close();
    }
  },

  clickedSearchTips : function(ev) {
    ev.preventDefault();
    new BH.Modals.SearchTipsModal().open();
  },

  getI18nValues : function() {
    return BH.Chrome.I18n.t([ 'delete_all_visits_for_search_button' ]);
  }
});

BH.Views.SearchControlsView = SearchControlsView;
})();
