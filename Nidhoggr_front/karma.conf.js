// Karma configuration file for CI with JUnit reporter
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-junit-reporter'),
      require('@angular/build/private')
    ],
    client: {
      clearContext: false
    },
    junitReporter: {
      outputDir: 'reports',
      outputFile: 'junit.xml',
      useBrowserName: false
    },
    reporters: ['progress', 'junit'],
    browsers: ['ChromeHeadless'],
    singleRun: true,
    autoWatch: false,
    browserDisconnectTimeout: 10000,
    browserNoActivityTimeout: 60000,
    captureTimeout: 60000
  });
};
