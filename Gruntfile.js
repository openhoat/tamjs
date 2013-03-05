var fs = require('fs')
  , path = require('path');

function buildCryptFileList() {
  var allFilesDir = ['controllers', 'lesscss', 'lib', 'locales', 'views']
    , fileList = [];
  fileList.push({
    dir:'.',
    include:['app.js', 'config.js', 'manifest.yml'],
    encryptedExtension:'.encrypted'
  });
  for (var i = 0; i < allFilesDir.length; i++) {
    fileList.push({
      dir:allFilesDir[i],
      include:'**/*',
      encryptedExtension:'.encrypted'
    });
  }
  return fileList;
}

module.exports = function (grunt) {
  var gruntConfig;
  grunt.loadTasks('tasks');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-crypt');
  grunt.registerTask('default', 'clean decrypt');
  gruntConfig = {
    pkg:'<json:package.json>',
    clean:{
      'default':['dist']
    },
    crypt:{
      files:buildCryptFileList(),
      options:{
        key:grunt.cli.options.key || 'somekey'
      }
    }
  };
  grunt.initConfig(gruntConfig);
};