# Honeybadger Client-Side Javascript Library

[![Build
Status](https://travis-ci.org/honeybadger-io/honeybadger-js.png?branch=master&1)](https://travis-ci.org/honeybadger-io/honeybadger-js)

A client-side JavaScript library for integrating apps with the :zap: [Honeybadger Error Notifier](http://honeybadger.io). For server-side javascript, check out our [NodeJS library](https://github.com/honeybadger-io/honeybadger-node).

## Documentation and Support

For comprehensive documentation and support, [check out our documentation site](http://docs.honeybadger.io/lib/javascript/index.html).

## Changelog

See https://github.com/honeybadger-io/honeybadger-js/blob/master/CHANGELOG.md

## Contributing

1. Fork it.
2. Create a topic branch `git checkout -b my_branch`
3. Commit your changes `git commit -am "Boom"`
3. Push to your branch `git push origin my_branch`
4. Send a [pull request](https://github.com/honeybadger-io/honeybadger-js/pulls)

### Development

First, install the required npm packages with `npm install`. After that you can run the dev server with `grunt dev`; this will launch a development server at *http://127.0.0.1:9999*. It will also run the test suite automatically when files change.

To run the test suite by itself, use `grunt jasmine`.

To run the tests across all supported platforms, set up a [Sauce Labs](https://saucelabs.com/)
account and use `SAUCE_USERNAME=your_username SAUCE_ACCESS_KEY=your-access-key grunt test`.

### License

The Honeybadger gem is MIT licensed. See the [MIT-LICENSE](https://raw.github.com/honeybadger-io/honeybadger-js/master/MIT-LICENSE) file in this repository for details.
