'use strict';
module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      client: {
        src: ['./index.js'],
        dest: 'browserify/jsonapi-serializer.js',
        options: {
          require: ['./index.js:jsonapi-serializer']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.registerTask('default', ['browserify']);
};
