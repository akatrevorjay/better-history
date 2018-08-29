(function() {
var DevicesListView = Backbone.View.extend({
  className : 'devices_list_view',

  template : 'devices_list.html',

  events : {'click a' : 'deviceClicked'},

  render : function() {
    presenter = new BH.Presenters.DevicesPresenter();
    var template = BH.Lib.Template.fetch(this.template);
    var html = Mustache.to_html(template,
                                presenter.deviceList(this.collection.toJSON()));
    this.$el.append(html);
    return this;
  },

  deviceClicked : function(ev) {
    ev.preventDefault();
    var $el = $(ev.currentTarget);

    this.$('.selected').removeClass('selected');
    $el.addClass('selected');

    this.model.set({name : $el.data('name')});
  }
});

BH.Views.DevicesListView = DevicesListView;
})();
