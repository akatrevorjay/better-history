# Change Log
All notable changes to this project will be documented in this file. See [Keep a
CHANGELOG](http://keepachangelog.com/) for how to update this file. This project
adheres to [Semantic Versioning](http://semver.org/).

## [0.5.5] - 2018-06-19
### Fixed
- Fixed an issue with the console binding fix. See #96.

## [0.5.4] - 2018-02-20
### Fixed
- Fix a problem with console binding with uglify and webpack. PR #92 by @geoffreak

## [0.5.3] - 2018-01-02
### Added
- Make use of quoted object properties to allow better ClojureScript
  compatibility. PR #87 by @rads

## [0.5.2] - 2017-11-07
### Fixed
- Warnings are now logged all the time. Previously they required the `debug`
  config option to be enabled.
- Non-error objects are now reported correctly from `window.onerror` and
  `Honeybadger.wrap`. For instance, `throw('string');` will result in the
  uncaught error being reported with the message "string".

### Added
- The limited stack info in `window.onerror` is now supplemented if the error
  object (in browsers which support it) does not have a stack property, such as
  when `String` is thrown.
- `maxErrors` configuration parameter setting a maximum number of errors
  that can be sent to Honeybadger.
- reset the current errors count `Honeybadger.resetMaxErrors();` utilized by
  the `maxErrors ` parameter.

## [0.5.1] - 2017-08-22
### Fixed
- Notification is now halted later in the process when `disabled` is `true` so
  that errors are still logged when disabled. -@novito
- Make calls to `Honeybadger.wrap` idempotent. Previously calling
  `Honeybadger.wrap(Honeybadger.wrap(func))` would wrap the function twice. Some
  events can be wrapped numerous times, causing a stack recursion error in
  certain environments (specifically IE 11).

## [0.5.0] - 2017-07-19
### Changed
- Honeybadger now uses source maps when available to group errors. If upgrading,
  some errors may be grouped differently (causing new errors to be created), but
  the new grouping will be more accurate.

## [0.4.9] - 2017-07-19
### Fixed
- Added missing declarations for variables. - @HolixSF

## [0.4.8] - 2017-05-25
### Added
- Allow error messages to be ignored. - @mhuerster

### Fixed
- Fixed "'prototype' is undefined" bug.

## [0.4.7] - 2017-04-20
### Fixed
- Fixed a bug which caused config values read from the "data-apiKey" and
  "data-projectRoot" attributes on script tag to be missing.

## [0.4.6] - 2017-03-27
### Fixed
- Fixed a bug which caused `window.url` to be overridden.
- Updated typescript definitions.

## [0.4.5] - 2017-02-23
### Fixed
- Fix bug where default properties "name" and "message" on error objects were
  not reported by `Honeybadger.notify`.

## [0.4.4] - 2017-02-23
### Added
- Metadata such as context can now be added to thrown errors via properties.
- The `async` config option can be enabled to make requests asynchronously when
  using XHR.
- Type declarations for TypeScript. See
  [honeybadger-js.d.ts](./honeybadger-js.d.ts)
- Camel case is now preferred for config options -- use `apiKey` instead of
  `api_key` and `projectRoot` instead of `project_root`. The old options are
  deprecated but will continue to be supported for the foreseeable future.

### Fixed
- Fixed a bug when including objects created without a prototype (i.e. with
  `Object.create(null)` in context data.
- Enforce strict mode.

## [0.4.3] - 2016-09-26
### Added
- Added option to send params and cookies.

## [0.4.2] - 2016-04-14
### Fixed
- Fixed a bug where logging wasn't available when request setup failed due to an
  error, which could result in an uncaught error being thrown.
- Check for presence of addEventListener before instrumenting it.

## [0.4.1] - 2016-02-25
### Fixed
- Fixed a bug where our DOMContentLoaded event listener wasn't added until after
  the event had already fired which prevented requests from being made.

## [0.4.0] - 2016-02-22
### Added
- Support reading configuration from data attributes on script tag.
- Improved `window.onerror` handling for IE 10+.
- A call stack is now generated in IE < 10 when reporting errors manually via
  `Honeybadger.notify`.
- Support for CommonJS and AMD.
- Example projects added for Browserify, webpack and RequireJS. (See
  [examples/](./examples))
- Test suite is now executed against a browser matrix (IE 6+) on TravisCI
  (using Sauce Labs).

### Changed
- Underlying code has been rewritten in plain JavaScript (CoffeeScript
  development dependency removed).
- The `onerror` configuration option is now enabled by default. All unhandled
  errors will be reported automatically.
- `Honeybadger.Client()` has been renamed to `Honeybadger.factory()`.
- `context` and other objects now have a maximum depth of 5 nested objects.
  When the maximum depth is reached, recursion will be halted with the value
  "[MAX DEPTH REACHED]". Maximum depth can be configured via the `max_depth`
  option.

### Removed
- The `timeout` configuration option has been removed (this may be reintroduced
  in the future, or we may limit the number of connections per browser session
  instead).

## [0.3.1] - 2015-08-13
### Fixed
- Sanitization bugfixes.

## [0.3.0] - 2015-07-28
### Added
- Sanitize circular data structures.
- Generate source map.

## [0.2.0] - 2015-01-16
### Added
- Use CORS to send data via POST when available.
- Improved error grouping.
