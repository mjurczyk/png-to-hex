/*
 * Grunt task implementation
 */
var convert = require(__dirname + '/../lib/convert');
var assign = require('object-assign');

module.exports = function (grunt) {
  grunt.registerMultiTask('png2hex', 'Convert PNG to HEX batches.', function (options) {
    var options = this.options();
    var files = this.files;
    var done = this.async();
    
    files.forEach(function (fileBatch) {
      fileBatch.src.forEach(function (file) {
        var config = {
          input: file,
          output: file.replace(/^(.*\/)?|(\..+)$/g, '')
        };
        assign(config, options);
        
        convert(config, function (err) {
          if (err) {
            grunt.fail.fatal(err); 
          }
          
          done();
        });
      });
    });
  });
};
