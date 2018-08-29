(function() {
var Router = Backbone.Router.extend({
  routes : {
    '' : 'visits',
    'devices' : 'devices',
    'statistic' : 'statistic',
    'settings' : 'settings',
    'search(/*query)' : 'search',
    'visits(/:date)' : 'visits'
  },

  initialize : function(options) {
    settings = options.settings;

    this.cache = new BH.Views.Cache({settings : settings});

    this.app = new BH.Views.AppView({el : $('.app')});
    this.app.render();

    this.on('route', function() { var url = Backbone.history.getFragment(); });
  },

  devices : function() {
    this.app.selectNav('.devices');

    var cacheView = this.cache.view('devices');
    var view = cacheView.view;

    delay(cacheView.transitioning, function() {
      new Historian.Devices().fetch(function(devices) {
        if (devices) {
          view.collection.reset(devices);
        } else {
          view.feature.set({supported : false});
        }
      });
    });
  },

  visits : function(date) {
    this.app.selectNav('.visits');

    if (!date) {
      date = 'today';
    }

    // special cases
    switch (date) {
    case 'today':
      date = moment();
      break;
    case 'yesterday':
      date = moment().subtract(1, 'days');
      break;
    default:
      date = moment(new Date(date));
    }

    date = date.startOf('day').toDate();

    var cacheView = this.cache.view('visits', [ date.getTime() ]);
    var view = cacheView.view;

    view.$('.search').focus();

    delay(cacheView.transitioning, function() {
      new Historian.Day(date).fetch(function(history) {
        if (history) {
          if (history.length !== view.collection.length) {
            view.collection.reset(history);
          }
        } else {
          view.feature.set({supported : false});
        }
      });
    });
  },

  settings : function() {
    this.app.selectNav('.settings');
    this.cache.view('settings');
  },

  search : function(query) {
    this.app.selectNav('.search');
    var view = this.cache.view('search').view;

    var _this = this;
    delay(true, function() {
      if (query) {
        view.model.set({query : decodeURIComponent(query)});
        view.historian = new Historian.Search(query);
        view.historian.fetch({}, function(history, cacheDatetime) {
          view.collection.reset(history);
          if (cacheDatetime) {
            view.model.set({cacheDatetime : cacheDatetime});
          } else {
            view.model.unset('cacheDatetime');
          }
        });
      } else {
        view.historian = new Historian.Search();
        view.historian.fetchCache(function(cache) {
          if (cache && cache.query) {
            _this.navigate("search/" + cache.query, {trigger : false});

            // Only trigger data reset if cache times differ. This is to prevent
            // data reload flicker between navigating to and from /#search
            var cachedDatetime = view.model.get('cacheDatetime');
            if (cachedDatetime) {
              if (cachedDatetime.getTime() != cache.datetime.getTime()) {
                view.model.set({
                  query : cache.query,
                  cacheDatetime : new Date(cache.datetime)
                });
                view.collection.reset(cache.results);
              }
            }
          }
        });
      }
    });
  },

  statistic : function() {
    this.app.selectNav('.statistic');

    var cacheView = this.cache.view('statistic');
    var view = cacheView.view;
    /*
          delay(cacheView.transitioning, function() {
            new Historian.Devices().fetch(function(devices) {
              if(statistic) {
                view.collection.reset(devices);
              } else {
                view.feature.set({supported: false});
              }
            });
          });
    */
  },

});

// if we need to transition to another view, delay the query until the
// transition fires. There can be a noticeable lag if the delay is skipped
var delay = function(shouldDelay, callback) {
  if (shouldDelay) {
    setTimeout(function() { callback(); }, 250);
  } else {
    callback();
  }
};

BH.Router = Router;
})();
