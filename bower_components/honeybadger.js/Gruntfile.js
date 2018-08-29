module.exports = function(grunt) {

  // NOTE: If certain OS/browser platforms start failing when grunt-sauselabs
  //       sends jobs to Sauce Labs, check that they still support the
  //       OS/browser platforms listed here.
  //       https://saucelabs.com/platforms
  //       https://wiki.saucelabs.com/display/DOCS/Platform+Configurator#/
  var browsers = [{
    browserName: 'firefox',
    platform: 'Windows 10'
  }, {
    browserName: 'googlechrome',
    platform: 'OS X 10.11'
  }, {
    browserName: 'googlechrome',
    platform: 'linux'
  }, {
    browserName: 'MicrosoftEdge',
    platform: 'Windows 10',
    version: '14.14393'
  }, {
    browserName: 'internet explorer',
    platform: 'Windows 8.1',
    version: '11.0'
  }, {
    browserName: 'internet explorer',
    platform: 'Windows 8',
    version: '10.0'
  }, {
    browserName: 'internet explorer',
    platform: 'Windows 7',
    version: '8.0'
  }];

  grunt.initConfig({
    connect: {
      server: {
        options: {
          base: '',
          port: 9999
        }
      }
    },
    jasmine: {
      src: ['honeybadger.js'],
      options: {
        specs: ['spec/honeybadger.spec.js'],
        vendor: ['vendor/sinon-1.17.3.js']
      }
    },
    'saucelabs-jasmine': {
      all: {
        options: {
          urls: ['http://127.0.0.1:9999/spec/runner.html'],
          build: process.env.TRAVIS_JOB_ID,
          browsers: browsers,
          testname: 'honeybadger.js specs',
          tags: ['master']
        }
      }
    },
    watch: {
      specs: {
        files: ['spec/**/*.js', 'honeybadger.js'],
        tasks: 'jasmine'
      }
    }
  });

  // Loading dependencies
  for (var key in grunt.file.readJSON('package.json').devDependencies) {
    if (key !== 'grunt' && key.indexOf('grunt') === 0) grunt.loadNpmTasks(key);
  }

  grunt.registerTask('dev', ['connect', 'watch']);
  grunt.registerTask('test', ['connect', 'saucelabs-jasmine']);
};
