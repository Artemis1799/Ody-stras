// Karma configuration file for testing
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('@angular/build/private'),
      require('karma-spec-reporter')
    ],
    files: [
      { pattern: './node_modules/zone.js/dist/zone.js', watched: false },
      { pattern: './node_modules/zone.js/dist/zone-testing.js', watched: false },
    ],
    client: {
      clearContext: false
    },
    reporters: ['spec'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    singleRun: false,
    restartOnFileChange: true,
    browserDisconnectTimeout: 10000,
    browserNoActivityTimeout: 60000,
    captureTimeout: 60000
  });
};
