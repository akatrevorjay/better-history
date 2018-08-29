(function() {
var VisitsResultsView = Backbone.View.extend({
  template : 'visits_results.html',

  events : {
    'click .download' : 'downloadClicked',
    'click .delete_hour' : 'deleteHourClicked',
    'click .delete_visit' : 'deleteVisitClicked',
    'click .delete_download' : 'deleteDownloadClicked',
    'click .visit > a' : 'visitClicked',
    'click .hours a' : 'hourClicked'
  },

  initialize : function() {
    this.hourModel = new Backbone.Model();
    this.hourModel.on('change:hour', this.onHourChanged, this);
  },

  render : function() {
    var properties = this.getI18nValues();
    var presenter = new BH.Presenters.VisitsPresenter();
    var visitsByHour = presenter.visitsByHour(this.collection.toJSON());
    var hours = presenter.hoursDistribution(this.collection.toJSON());

    if (this.collection.length > 0) {
      var date = new Date(this.model.get('date'));
      properties.history = {
        visitsByHour : visitsByHour.reverse(),
        date : date.toLocaleDateString('en'),
        day : moment(date).format('dddd'),
        hours : hours
      };
    }

    var template = BH.Lib.Template.fetch(this.template);
    var html = Mustache.to_html(template, properties);

    this.$el.html(html);

    document.body.scrollTop = 0;

    this.show();
    this.inflateDates();
    this.inflateDownloadIcons();

    // Mark first available hour as selected
    this.$('.controls.hours a:not(.disabled)').eq(0).addClass('selected');

    var _this = this;
    hourScrollSpy(function(hour) { _this.hourModel.set({hour : hour}); });

    return this;
  },

  resetRender : function() {
    this.hide();
    this.$('.visits_content').html('');
  },

  show : function() { this.$el.removeClass('disappear'); },

  hide : function() { this.$el.addClass('disappear'); },

  inflateDates : function() {
    var _this = this;
    $('.time').each(function(i, el) {
      var model = _this.collection.at(i);
      timestamp = model.get('lastVisitTime') || model.get('startTime');
      $(el).text(new Date(timestamp).toLocaleTimeString(BH.lang));
    });
  },

  inflateDownloadIcons : function() {
    var callback = function(el, uri) {
      $(el).find('.description').css({backgroundImage : "url(" + uri + ")"});
    };

    $('.download').each(function(i, el) {
      downloadId = parseInt($(el).data('download-id'), 10);
      chrome.downloads.getFileIcon(downloadId, {},
                                   function(uri) { callback(el, uri); });
    });
  },

  visitClicked : function(ev) {
    if ($(ev.target).hasClass('search_domain')) {
      ev.preventDefault();
      router.navigate($(ev.target).attr('href'), {trigger : true});
    }
  },

  hourClicked : function(ev) {
    ev.preventDefault();
    var hour = $(ev.currentTarget).data('hour');
    scrollToHour(hour);
  },

  onHourChanged : function() {
    var hour = this.hourModel.get('hour');
    this.$('.hours a').removeClass("selected");
    this.$(".hours a[data-hour='" + hour + "']").addClass("selected");
  },

  downloadClicked : function(ev) {
    ev.preventDefault();
    var $el = $(ev.currentTarget);
    var downloadId = parseInt($el.data('download-id'), 10);
    chrome.downloads.show(downloadId);
  },

  deleteHourClicked : function(ev) {
    ev.preventDefault();
    var hour = $(ev.currentTarget).data('hour');
    this.promptToDeleteHour(hour);
  },

  deleteVisitClicked : function(ev) {
    ev.preventDefault();
    var $el = $(ev.currentTarget);
    Historian.deleteUrl($el.data('url'),
                        function() { $el.parent('.visit').remove(); });
  },

  deleteDownloadClicked : function(ev) {
    ev.preventDefault();
    var $el = $(ev.currentTarget);
    Historian.deleteDownload($el.data('url'),
                             function() { $el.parent('.visit').remove(); });
  },

  promptToDeleteHour : function(hour) {
    var date = new Date(this.model.get('date'));
    date.setHours(hour);
    date.setSeconds(0);
    date.setMinutes(0);
    var timestamp = date.toLocaleString(BH.lang);
    var promptMessage =
        BH.Chrome.I18n.t('confirm_delete_all_visits', [ timestamp ]);
    this.promptView = BH.Modals.CreatePrompt(promptMessage);
    this.promptView.open();

    var _this = this;
    this.promptView.model.on(
        'change', function(prompt) { _this.promptAction(prompt, hour); }, this);
  },

  promptAction : function(prompt, hour) {
    if (prompt.get('action')) {
      var date = new Date(this.model.get('date'));
      var dayHistorian = new Historian.Day(date);

      var _this = this;
      dayHistorian.destroyHour(hour, function() {
        // Remove the hour container from the DOM and unselect
        // the active hour in the menu.
        $('.hour_visits[data-hour=' + hour + ']').remove();
        $('a[data-hour=' + hour + ']').addClass('disabled');

        // After an hour is removed, the active hour in the menu
        // must be updated. Manually trigger a scroll event.
        $(window).trigger('scroll');

        _this.promptView.close();
      });
    } else {
      this.promptView.close();
    }
  },

  getI18nValues : function() {
    return BH.Chrome.I18n.t([
      'prompt_delete_button', 'delete_time_interval_button', 'no_visits_found',
      'expand_button', 'collapse_button', 'search_by_domain',
      'delete_all_visits_for_filter_button'
    ]);
  }
});

var hourScrollSpy = function(cb) {
  var lastId = null;
  var topMenu = $('.hours');
  var topMenuHeight = topMenu.outerHeight();
  var menuItems = topMenu.find("a");
  var scrollItems = menuItems.map(function() {
    var item = $($(this).attr("href"));
    if (item.length) {
      return item;
    }
  });

  $(window).scroll(function() {
    // Get container scroll position
    var fromTop = $(this).scrollTop() + topMenuHeight;

    // Get id of current scroll item
    var cur = scrollItems.map(function() {
      if (($(this).offset().top - 205) < fromTop) {
        return this;
      }
    });

    // Get the id of the current element
    cur = cur[cur.length - 1];
    var id = cur && cur.length ? cur[0].id : "";

    if (lastId !== id) {
      lastId = id;

      var $el = menuItems.filter("[href='#" + id + "']");
      cb($el.data('hour'));
    }
  });
};

var scrollToHour = function(hour) {
  var topMenuHeight = $('.hours').outerHeight(),
      $el = $('.hour_visits[data-hour=' + hour + ']');

  if ($el.length > 0) {
    var offsetTop = $el.offset().top - topMenuHeight + 1;

    $('html, body').stop().animate({scrollTop : offsetTop - 120}, 300);
  }
};

BH.Views.VisitsResultsView = VisitsResultsView;
})();
