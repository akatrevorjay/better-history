(function() {
var SearchTipsModal = BH.Modals.Base.extend({
  className : 'search_tips_view modal',
  template : 'search_tips.html',

  events : {
    'click .close' : 'closeClicked',
    'click .content-area a' : 'linkClicked'
  },

  initialize : function() { this.attachGeneralEvents(); },

  render : function() {
    this.$el.html(this.renderTemplate(this.getI18nValues()));
    return this;
  },

  closeClicked : function(ev) {
    ev.preventDefault();
    this.close();
  },

  linkClicked : function(ev) { this.close(); },

  getI18nValues : function() {
    return BH.Chrome.I18n.t(
        [ 'close_button', 'search_tips_title', 'search_suggestion_link' ]);
  }
});

BH.Modals.SearchTipsModal = SearchTipsModal;
})();
