var path = require('path')

module.exports = function (grunt) {
  'use strict'

  // Project configuration.
  grunt.initConfig({
    'clean': {
      test: [
        'test/fixtures/out/'
      ]
    },

    'eslint': {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>'
      ]
    },

    'electron-installer-debian': {
      options: {
        productDescription: 'Just a test.',
        section: 'devel',
        priority: 'optional',
        arch: 'i386',
        depends: [],
        recommends: [],
        suggests: [],
        categories: []
      },

      'app-with-asar': {
        src: 'test/fixtures/app-with-asar/',
        dest: 'test/fixtures/out/',
        rename: function (dest) {
          return path.join(dest, '<%= name %>_<%= arch %>.deb')
        }
      },

      'app-without-asar': {
        options: {
          arch: 'amd64',
          lintianOverrides: [
            'changelog-file-missing-in-native-package',
            'executable-not-elf-or-script',
            'extra-license-file'
          ],

          icon: 'test/fixtures/icon.png',
          bin: 'resources/cli/bar.sh',
          categories: [
            'Utility'
          ]
        },

        src: 'test/fixtures/app-without-asar/',
        dest: 'test/fixtures/out/',
        rename: function (dest) {
          return path.join(dest, '<%= name %>_<%= arch %>.deb')
        }
      }
    },

    'nodeunit': {
      tests: ['test/*_test.js']
    }
  })

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks')

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-nodeunit')
  grunt.loadNpmTasks('grunt-eslint')

  // Whenever the "test" task is run, first lint everything, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'eslint', 'electron-installer-debian', 'nodeunit'])

  // By default, lint and run all tests.
  grunt.registerTask('default', ['test'])
}
