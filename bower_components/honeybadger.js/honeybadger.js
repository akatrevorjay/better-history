/*
  honeybadger.js v0.5.5
  A JavaScript Notifier for Honeybadger
  https://github.com/honeybadger-io/honeybadger-js
  https://www.honeybadger.io/
  MIT license
*/

(function (root, builder) {
  'use strict';
  // Read default configuration from script tag if available.
  var scriptConfig = {};
  (function() {
    var tags = document.getElementsByTagName("script");
    var tag = tags[tags.length - 1];
    if (!tag) { return; }
    var attrs = tag.attributes;
    var value;
    for (var i = 0, len = attrs.length; i < len; i++) {
      if (/data-(\w+)$/.test(attrs[i].nodeName)) {
        value = attrs[i].nodeValue;
        if (value === 'false') { value = false; }
        scriptConfig[RegExp.$1] = value;
      }
    }
  })();

  // Build the singleton factory. The factory can be accessed through
  // singleton.factory() to instantiate a new instance.
  var factory = function(){
    var f = builder();
    var singleton = f(scriptConfig);
    singleton.factory = f;
    return singleton;
  };

  // UMD (Universal Module Definition)
  // See https://github.com/umdjs/umd
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Browserify. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Browserfy/Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window).
    root.Honeybadger = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  var VERSION = '0.5.5',
      NOTIFIER = {
        name: 'honeybadger.js',
        url: 'https://github.com/honeybadger-io/honeybadger-js',
        version: VERSION,
        language: 'javascript'
      };

  // Used to control initial setup across clients.
  var loaded = false,
      installed = false;

  // Used to prevent reporting duplicate errors across instances.
  var currentErr,
      currentPayload;

  // Utilities.
  function merge(obj1, obj2) {
    var obj3 = {};
    for (var k in obj1) { obj3[k] = obj1[k]; }
    for (var k in obj2) { obj3[k] = obj2[k]; }
    return obj3;
  }

  function currentErrIs(err) {
    if (!currentErr) { return false; }
    if (currentErr.name !== err.name) { return false; }
    if (currentErr.message !== err.message) { return false; }
    if (currentErr.stack !== err.stack) { return false; }
    return true;
  }

  function isIgnored(err, patterns) {
    var msg = err.message;

    for (var p in patterns) {
      if (msg.match(patterns[p])) { return true; }
    }

    return false;
  }

  function cgiData() {
    var data = {};
    data['HTTP_USER_AGENT'] = navigator.userAgent;
    if (document.referrer.match(/\S/)) {
      data['HTTP_REFERER'] = document.referrer;
    }
    return data;
  }

  function encodeCookie(object) {
    if (typeof object !== 'object') {
      return undefined;
    }

    var cookies = [];
    for (var k in object) {
      cookies.push(k + '=' + object[k]);
    }

    return cookies.join(';');
  }

  function stackTrace(err) {
    // From TraceKit: Opera 10 *destroys* its stacktrace property if you try to
    // access the stack property first.
    return err.stacktrace || err.stack || undefined
  }

  function generateStackTrace(err) {
    var stack;
    var maxStackSize = 10;

    if (err && (stack = stackTrace(err))) {
      return {stack: stack, generator: undefined};
    }

    try {
      throw new Error('');
    } catch(e) {
      if (stack = stackTrace(e)) {
        return {stack: stack, generator: 'throw'};
      }
    }

    stack = ['<call-stack>'];
    var curr = arguments.callee;
    while (curr && stack.length < maxStackSize) {
      if (/function(?:\s+([\w$]+))+\s*\(/.test(curr.toString())) {
        stack.push(RegExp.$1 || '<anonymous>');
      } else {
        stack.push('<anonymous>');
      }
      try {
        curr = curr.caller;
      } catch (e) {
        break;
      }
    }

    return {stack: stack.join('\n'), generator: 'walk'};
  }

  function checkHandlers(handlers, err) {
    var handler, i, len;
    for (i = 0, len = handlers.length; i < len; i++) {
      handler = handlers[i];
      if (handler(err) === false) {
        return true;
      }
    }
    return false;
  }

  // Client factory.
  var factory = (function(opts) {
    var defaultProps = [];
    var queue = [];
    var self = {
      context: {},
      beforeNotifyHandlers: [],
      errorsSent: 0
    }
    if (typeof opts === 'object') {
      for (var k in opts) { self[k] = opts[k]; }
    }

    function log() {
      var console = window.console;
      if (console) {
        var args = Array.prototype.slice.call(arguments);
        args.unshift('[Honeybadger]');
        console.log.apply(console, args);
      }
    }

    function debug() {
      if (config('debug')) {
        return log.apply(this, arguments);
      }
    }

    function config(key, fallback) {
      var value = self[key];
      if (value === undefined) { value = self[key.toLowerCase()] }
      if (value === 'false') { value = false; }
      if (value !== undefined) { return value; }
      return fallback;
    }

    function baseURL() {
      return 'http' + ((config('ssl', true) && 's') || '') + '://' + config('host', 'api.honeybadger.io');
    }

    function canSerialize(obj) {
      // Functions are TMI and Symbols can't convert to strings.
      if (/function|symbol/.test(typeof(obj))) { return false; }

      // No prototype, likely created with `Object.create(null)`.
      if (typeof obj === 'object' && typeof obj.hasOwnProperty === 'undefined') { return false; }

      return true;
    }

    function serialize(obj, prefix, depth) {
      var k, pk, ret, v;
      ret = [];
      if (!depth) { depth = 0; }
      if (depth >= config('max_depth', 8)) {
        return encodeURIComponent(prefix) + '=[MAX DEPTH REACHED]';
      }
      for (k in obj) {
        v = obj[k];
        if (obj.hasOwnProperty(k) && (k != null) && (v != null)) {
          if (!canSerialize(v)) { v = Object.prototype.toString.call(v); }
          pk = (prefix ? prefix + '[' + k + ']' : k);
          ret.push(typeof v === 'object' ? serialize(v, pk, depth+1) : encodeURIComponent(pk) + '=' + encodeURIComponent(v));
        }
      }
      return ret.join('&');
    }

    function request(url) {
      if (config('disabled', false)) { return false; }
      if (exceedsMaxErrors()) { return false; }

      // Use XHR when available.
      try {
        // Inspired by https://gist.github.com/Xeoncross/7663273
        var x = new(window.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
        x.open('GET', url, config('async', true));
        x.send();
        incrementErrorsCount();
        return;
      } catch(e) {
        log('Error encountered during XHR request (will retry): ' + e);
      }

      // Fall back to Image transport.
      var img = new Image();
      img.src = url;
    }

    function send(payload) {
      currentErr = currentPayload = null;

      var apiKey = config('apiKey', config('api_key'));
      if (!apiKey) {
        log('Unable to send error report: no API key has been configured.');
        return false;
      }

      var url = baseURL() + '/v1/notices/js.gif?' + serialize({'notice': payload}) +
        '&api_key=' + apiKey + '&t=' + new Date().getTime();

      request(url);

      return true;
    }

    function notify(err, generated) {
      if (!err) { err = {}; }

      if (Object.prototype.toString.call(err) === '[object Error]') {
        var e = err;
        err = merge(err, {name: e.name, message: e.message, stack: stackTrace(e)})
      }

      if (!(typeof err === 'object')) {
        var m = String(err);
        err = {message: m};
      }

      if (currentErrIs(err)) {
        // Skip the duplicate error.
        return false;
      } else if (currentPayload && loaded) {
        // This is a different error, send the old one now.
        send(currentPayload);
      }

      // Halt if err is empty.
      if (((function() {
        var k, results;
        results = [];
        for (k in err) {
          if (!{}.hasOwnProperty.call(err, k)) continue;
          results.push(k);
        }
        return results;
      })()).length === 0) {
        return false;
      }

      if (generated) {
        err = merge(err, generated);
      }

      if (isIgnored(err, config('ignorePatterns'))) { return false; }

      if (checkHandlers(self.beforeNotifyHandlers, err)) { return false; }

      var data = cgiData();
      if (typeof err.cookies === 'string') {
        data['HTTP_COOKIE'] = err.cookies;
      } else if (typeof err.cookies === 'object') {
        data['HTTP_COOKIE'] = encodeCookie(err.cookies);
      }

      var payload = {
        'notifier': NOTIFIER,
        'error': {
          'class': err.name || 'Error',
          'message': err.message,
          'backtrace': err.stack,
          'generator': err.generator,
          'fingerprint': err.fingerprint
        },
        'request': {
          'url': err.url || document.URL,
          'component': err.component || config('component'),
          'action': err.action || config('action'),
          'context': merge(self.context, err.context),
          'cgi_data': data,
          'params': err.params
        },
        'server': {
          'project_root': err.projectRoot || err.project_root || config('projectRoot', config('project_root', window.location.protocol + '//' + window.location.host)),
          'environment_name': err.environment || config('environment'),
          'revision': err.revision || config('revision')
        }
      };

      currentPayload = payload;
      currentErr = err;

      if (loaded) {
        debug('Deferring notice.', err, payload);
        window.setTimeout(function(){
          if (currentErrIs(err)) {
            send(payload);
          }
        });
      } else {
        debug('Queuing notice.', err, payload);
        queue.push(payload);
      }

      return err;
    }

    function objectIsExtensible(obj) {
      if (typeof Object.isExtensible !== 'function') { return true; }
      return Object.isExtensible(obj);
    }

    var preferCatch = true;
    // IE < 10
    if (!window.atob) { preferCatch = false; }
    // See https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent
    if (window.ErrorEvent) {
      try {
        if ((new window.ErrorEvent('')).colno === 0) {
          preferCatch = false;
        }
      } catch(_e) {}
    }

    // wrap always returns the same function so that callbacks can be removed via
    // removeEventListener.
    function wrap(fn, force) {
      try {
        if (typeof fn !== 'function') { return fn; }
        if (!objectIsExtensible(fn))  { return fn; }
        if (!fn.___hb) {
          fn.___hb = function() {
            var onerror = config('onerror', true);
            // Don't catch if the browser is old or supports the new error
            // object and there is a window.onerror handler available instead.
            if ((preferCatch && (onerror || force)) || (force && !onerror)) {
              try {
                return fn.apply(this, arguments);
              } catch (e) {
                notify(e);
                throw(e);
              }
            } else {
              return fn.apply(this, arguments);
            }
          };
        }
        fn.___hb.___hb = fn.___hb;
        return fn.___hb;
      } catch(_e) {
        return fn;
      }
    }

    // Public API.
    self.notify = function(err, name, extra) {
      if (!err) { err = {}; }

      if (Object.prototype.toString.call(err) === '[object Error]') {
        var e = err;
        err = merge(err, {name: e.name, message: e.message, stack: stackTrace(e)})
      }

      if (!(typeof err === 'object')) {
        var m = String(err);
        err = {message: m};
      }

      if (name && !(typeof name === 'object')) {
        var n = String(name);
        name = {name: n};
      }

      if (name) {
        err = merge(err, name);
      }
      if (typeof extra === 'object') {
        err = merge(err, extra);
      }

      return notify(err, generateStackTrace(err));
    };

    self.wrap = function(func) {
      return wrap(func, true);
    };

    self.setContext = function(context) {
      if (typeof context === 'object') {
        self.context = merge(self.context, context);
      }
      return self;
    };

    self.resetContext = function(context) {
      if (typeof context === 'object') {
        self.context = merge({}, context);
      } else {
        self.context = {};
      }
      return self;
    };

    self.configure = function(opts) {
      for (var k in opts) {
        self[k] = opts[k];
      }
      return self;
    };

    self.beforeNotify = function(handler) {
      self.beforeNotifyHandlers.push(handler);
      return self;
    };

    var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };
    self.reset = function() {
      self.context = {};
      self.beforeNotifyHandlers = [];
      for (var k in self) {
        if (indexOf.call(defaultProps, k) == -1) {
          self[k] = undefined;
        }
      }
      self.resetMaxErrors();
      return self;
    };

    self.resetMaxErrors = function() {
      return (self.errorsSent=0);
    };

    self.getVersion = function() {
      return VERSION;
    }

    // Install instrumentation.
    // This should happen once for the first factory call.
    function instrument(object, name, replacement) {
      if (installed) { return; }
      if (!object || !name || !replacement) { return; }
      var original = object[name];
      object[name] = replacement(original);
    }

    var instrumentTimer = function(original) {
      // See https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setTimeout
      return function(func, delay) {
        if (typeof func === 'function') {
          var args = Array.prototype.slice.call(arguments, 2);
          func = wrap(func);
          return original(function() {
            func.apply(null, args);
          }, delay);
        } else {
          return original(func, delay);
        }
      }
    };
    instrument(window, 'setTimeout', instrumentTimer);
    instrument(window, 'setInterval', instrumentTimer);

    // Event targets borrowed from bugsnag-js:
    // See https://github.com/bugsnag/bugsnag-js/blob/d55af916a4d3c7757f979d887f9533fe1a04cc93/src/bugsnag.js#L542
    'EventTarget Window Node ApplicationCache AudioTrackList ChannelMergerNode CryptoOperation EventSource FileReader HTMLUnknownElement IDBDatabase IDBRequest IDBTransaction KeyOperation MediaController MessagePort ModalWindow Notification SVGElementInstance Screen TextTrack TextTrackCue TextTrackList WebSocket WebSocketWorker Worker XMLHttpRequest XMLHttpRequestEventTarget XMLHttpRequestUpload'.replace(/\w+/g, function (prop) {
      var prototype = window[prop] && window[prop].prototype;
      if (prototype && prototype.hasOwnProperty && prototype.hasOwnProperty('addEventListener')) {
        instrument(prototype, 'addEventListener', function(original) {
          // See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
          return function(type, listener, useCapture, wantsUntrusted) {
            try {
              if (listener && listener.handleEvent != null) {
                listener.handleEvent = wrap(listener.handleEvent);
              }
            } catch(e) {
              // Ignore 'Permission denied to access property "handleEvent"' errors.
              log(e);
            }
            return original.call(this, type, wrap(listener), useCapture, wantsUntrusted);
          };
        });
        instrument(prototype, 'removeEventListener', function(original) {
          return function(type, listener, useCapture, wantsUntrusted) {
            original.call(this, type, listener, useCapture, wantsUntrusted);
            return original.call(this, type, wrap(listener), useCapture, wantsUntrusted);
          };
        });
      }
    });

    instrument(window, 'onerror', function(original) {
      function onerror(msg, url, line, col, err) {
        debug('window.onerror callback invoked.', arguments);

        // Skip if the error is already being sent.
        if (currentErr) { return; }

        if (!config('onerror', true)) { return; }

        if (line === 0 && /Script error\.?/.test(msg)) {
          // See https://developer.mozilla.org/en/docs/Web/API/GlobalEventHandlers/onerror#Notes
          log('Ignoring cross-domain script error. Use CORS to enable tracking of these types of errors.', arguments);
          return;
        }

        // simulate v8 stack
        var stack = [msg, '\n    at ? (', url || 'unknown', ':', line || 0, ':', col || 0, ')'].join('');

        if (err) {
          var generated = { stack: stackTrace(err) };
          if (!generated.stack) { generated = {stack: stack}; }
          notify(err, generated);
          return;
        }

        notify({
          name: 'window.onerror',
          message: msg,
          stack: stack
        });
      }
      // See https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror
      return function(msg, url, line, col, err) {
        onerror(msg, url, line, col, err);
        if (typeof original === 'function') {
          return original.apply(this, arguments);
        }
        return false;
      };
    });

    function incrementErrorsCount() {
      return self.errorsSent++;
    }

    function exceedsMaxErrors() {
      var maxErrors = config('maxErrors');
      return maxErrors && self.errorsSent >= maxErrors;
    }

    // End of instrumentation.
    installed = true;

    // Save original state for reset()
    for (var k in self) {
      defaultProps.push(k);
    }

    // Initialization.
    debug('Initializing honeybadger.js ' + VERSION);

    // See https://developer.mozilla.org/en-US/docs/Web/API/Document/readyState
    // https://www.w3.org/TR/html5/dom.html#dom-document-readystate
    // The 'loaded' state is for older versions of Safari.
    if (/complete|interactive|loaded/.test(document.readyState)) {
      loaded = true;
      debug('honeybadger.js ' + VERSION + ' ready');
    } else {
      debug('Installing ready handler');
      var domReady = function() {
        loaded = true;
        debug('honeybadger.js ' + VERSION + ' ready');
        var notice;
        while (notice = queue.pop()) {
          send(notice);
        }
      };
      if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', domReady, true);
      } else {
        window.attachEvent('onload', domReady);
      }
    }

    return self;
  });

  return factory;
}));
