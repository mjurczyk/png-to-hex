/*
 * @author mjurczyk
 * @license MIT license (MIT)
 * @repo https://github.com/mjurczyk/png-to-hex
 */
var fs = require('fs');
var mime = require('mime');
var PNG = require('node-png').PNG;
var binToHex = require('./bin2hex');
var assign = require('object-assign');

/**
 * @async
 * @callback callback
 * @exports convert module
 * 
 * Convert module is the main interface of the png-to-hex package.
 * This is automatic launch module, hence it has no public interface,
 * apart from `exports`.
 * 
 * No public api is available, unless modified. Refer to further method
 * jsdocs if necessary.
 * 
 * @param   {Object}   config   configuration override object (@see defaults argv)
 * @param   {Function} callback final callback called with `err` argument or null
 */
module.exports = function (config, callback) {
  /*
   * @private
   * 
   * Default configuration.
   */
  var defaults = {
    output: 'image',
    outputDir: './output',
    outputExt: 'txt',
    minify: false,
    pngFilter: -1,
    bwThreshold: 1.7,
    batchWidth: 5,
    batchHeight: 8,
    preview: false,
    previewDir: './preview',
    previewExt: 'png'
  };
  
  /*
   * @private
   * @todo introduce more filetypes
   * 
   * Acceptable filetypes. Added here in case more filetypes will
   * be available for conversion.
   */
  var acceptableFiletypes = [
    'image/png'
  ];
  
  /*
   * @private
   * 
   * Acceptable configuration parameters.
   * 
   * @see README.md
   */
  var argv = {
    config: argVal('-c') || argVal('-conf') || argVal('-config') || config,
    input: argVal('-file') || argVal('-f') || argVal('-i') || argVal('-input') || argVal(2),
    output: argVal('-o') || argVal('-output') || defaults.output,
    outputDir: argVal('-odir') || defaults.outputDir,
    outputExt: argVal('-oext') || defaults.outputExt,
    minify: argExists('-minify') || argExists('-min') || defaults.minify,
    pngFilter: argVal('-filter') || argVal('-flt') || defaults.pngFilter,
    bwThreshold: argVal('-threshold') || argVal('-thr') || defaults.bwThreshold,
    batchWidth: argVal('-w') || argVal('-width') || defaults.batchWidth,
    batchHeight: argVal('-h') || argVal('-heght') || defaults.batchHeight,
    preview: argExists('-p') || argExists('-preview') || defaults.preview,
    previewDir: argVal('-pdir') || defaults.previewDir,
    previewExt: argVal('-pext') || defaults.previewExt
  };
  
  /**
   * Check if module callback is a function, assign noop function
   * if necessary.
   */
  function checkCallback () {
    if (typeof callback !== 'function') {
      callback = function () {};
    }
  };
  
  /**
   * @sync
   * 
   * Custom log method.
   * 
   * @param {List} arguments  all arguments will be concatenated and logged as a string
   */
  function log () {
    var msg = [];
    
    var i;
    var j;
    
    for (i = 0, j = arguments.length; i < j; i++) {
      msg.push(arguments[i]);
    }
    
    msg = '<png-to-hex>' + msg.join(' ');
    
    if (typeof console !== 'undefined') {
      console.log(msg);
    } else if (typeof grunt !== 'undefined' ) {
      grunt.log.info(msg);
    } else {
      process.stdout.write(msg + '\n'); 
    }
  };
  
  /**
   * @sync
   * 
   * Read argument value from command line.
   * 
   * If string is given, it is interpreted as argument name.
   * If non-string value is given, it is interpretes as argument place
   * in args array.
   * 
   * @param   {String|Non-string}    argName @see description for more info
   * @returns {String} argument value or null
   */
  function argVal (argName) {
    var args = process.argv;
    var index;
    
    if (typeof argName === 'string') {
      index = args.indexOf(argName);
      
      if (index === -1) {
        return null;
      } else {
        if (index < args.length - 1) {
          return args[index + 1];
        } else {
          return null; 
        }
      }
    } else {
      return argName < args.length ? args[argName] : null;
    }
  };
  
  /**
   * @sync
   * 
   * Determine whether argument was passed in the command line.
   * 
   * @param   {String}  argName argument name
   * @returns {Boolean} argument exists
   */
  function argExists (argName) {
    var args = process.argv;
    
    if (typeof argName === 'string') {
      return args.indexOf(argName) === -1 ? false : true;
    } else {
      return false; 
    }
  };
  
  /**
   * @async
   * @callback then
   * 
   * If config passed to module is a string, it is interpeted as
   * a path to the config file. File is read and parsed via JSON
   * module.
   * If otherwise, config is interpreted as an Object and passed 
   * directly to the callback.
   * 
   * @param {String|Object} config @see description for more
   * @param {Function}      then   callback
   */
  function applyConfig (config, then) {
    if (typeof then !== 'function') {
      then = function () {}; 
    }
    
    if (typeof config === 'string') {
      fs.readFile(config, function (err, data) {
        if (err) {
          throw err; 
        }
        
        try {
          config = JSON.parse(data); 
        } catch (err) {
          throw err; 
        }
        
        then(config);
      });
    } else {
      then(config); 
    }
  };
  
  /**
   * @sync
   * 
   * Initialize conversion.
   */
  function run () {
    log('starting conversion of', argv.input);
    
    validateOutputName(argv.output);
    validateFile(argv.input);
  };
  
  /**
   * @async
   * @callback readFile
   * 
   * Validate module input file.
   * 
   * Necessary:
   * - file has to exist and is readable
   * - file is of a proper MIME type (@see acceptableFiletypes)
   * 
   * @param {[[Type]]} inputFile [[Description]]
   */
  function validateFile (inputFile) {
    log('validating input file');
    
    fs.stat(inputFile, function (err, stat) {
      var fileType = mime.lookup(inputFile);
      
      if (err) {
        throw err;
      }

      if (acceptableFiletypes.indexOf(fileType) === -1) {
        throw fileType + ' is not an acceptable input file type.';
      }
      
      if (stat.isFile()) {
        readFile(inputFile);
      } else {
        throw 'Input value is not a file'; 
      }
    });
  };
  
  /**
   * @sync
   * 
   * Determine whether a filename is an acceptable output filename.
   * Remove file extension from the name, if necessary.
   * 
   * Necessary:
   * - output file has to be a valid C variable type
   * 
   * @param {String} name tested filename
   */
  function validateOutputName (name) {
    var includesExtension;
    var cStyleName;
    
    log('validating output variable name');
    
    includesExtension = (name.match(/\..*/gm) || []).length > 0;
    if (includesExtension) {
      argv.output = name = name.replace(/\..*/gm, '');
    }
    
    cStyleName = (name.match(/^[A-Za-z_][A-Za-z_0-9]*$/gm) || []).length === 1;
    if (!cStyleName) {
      throw 'Invalid output name. Output must be a valid C-style variable name.';
    }
  };
  
  /**
   * @sync
   * 
   * Determine whether the passed input image is valid in terms of size.
   * 
   * Necessary:
   * - file dimensions have to be divisible into batches/chunks
   * 
   * Batch size is defined in configuration.
   * 
   * @param   {Object}  imageData image data, including width and height
   * @returns {Boolean} image is valid
   */
  function validateImageSize (imageData) {
    var horizontalCheck = imageData.width % argv.batchWidth === 0;
    var verticalCheck = imageData.height % argv.batchHeight === 0;
    
    if (!horizontalCheck) {
      log('image width (', imageData.width, ') not divisible by batch width (', argv.batchWidth, ')');
    }
    if (!verticalCheck) {
      log('image height (', imageData.has, ') not divisible by batch height (', argv.batchHeight, ')');
    }
    if(horizontalCheck && verticalCheck) {
      log('image size OK');
      
      return true;
    } else {
      return false; 
    }
  };
  
  /**
   * @async
   * @callback (1) desaturateImage
   * @callback (2) convertFile
   * 
   * Read image file and put it through node-png library filter.
   * 
   * @param {String} inputFile image file path
   */
  function readFile (inputFile) {
    log('reading input data');
    
    fs.createReadStream(inputFile)
    .pipe(new PNG({
      filterType: argv.pngFilter
    }))
    .on('parsed', function () {
      convertFile(desaturateImage(this));
    })
    .on('error', function (err) {
      throw err;
    });
  };
  
  /**
   * @sync
   * @todo introduce gradient shading
   * 
   * Transform image into pure black&white bitmap.
   * 
   * If a pixel combined RGB values are over a configured threshold, 
   * its made white.
   * Otherwise, pixel is made black.
   * 
   * @param   {Object} imageData image data
   * @returns {Object} B&W image data
   */
  function desaturateImage (imageData) {
    var x;
    var w;
    var y;
    var h;

    var pixel;
    var r;
    var g;
    var b;

    for (x = 0, w = imageData.width; x < w; x++) {
      for (y = 0, h = imageData.height; y < h; y++) {
        pixel = (w * y + x) << 2;

        r = imageData.data[pixel] / 255;
        g = imageData.data[(pixel + 1)] / 255;
        b = imageData.data[(pixel + 2)] / 255;

        if (r + g + b < argv.bwThreshold) {
          imageData.data[pixel] = imageData.data[pixel + 1] = imageData.data[pixel + 2] = 0; 
        } else {
          imageData.data[pixel] = imageData.data[pixel + 1] = imageData.data[pixel + 2] = 255;
        }
      }
    }
    
    return imageData;
  };
  
  /**
   * @async
   * @callback saveFile
   * @callback (optional) savePreviewFile
   * @implements _min
   * 
   * Convert image pixels into hexadecimal value batches.
   * 
   * Image data is first transformed into columns of binary
   * values. After that, binary value is translated into
   * hexadecimal and put into a batch.
   * 
   * Calls savePreviewFile, if necessary.
   * 
   * Output format is a C code in the following manner:
   * 
   * const static int {image}_width = {image_width / batch_width};
   * const static int {image}_height = {image_height / batch_height};
   * const static byte {image}[][{batch_width}] = {
   *   { batch_0_0_fragments },
   *   { batch_1_0_fragments },
   *   ...
   *   { batch_M_N_fragments }
   * };
   * 
   * @param   {Object} image image data
   * @see README.md
   */
  function convertFile (image) {
    var output = [];
    var batches = [];
    var batchSize = {
      w: argv.batchWidth,
      h: argv.batchHeight
    };
    
    var col;
    var fragment;
    var pixel;
    
    var x;
    var w;
    var y;
    var h;
    
    var i;
    var j;
    
    log('converting data into binary batches');
    
    for (y = 0, h = image.height; y < h; y += batchSize.h) {
      for (x = 0, w = image.width; x < w; x += batchSize.w) {
        fragment = [];
        
        for (i = 0; i < batchSize.w; i++) {
          col = [];
          
          for (j = 0; j < batchSize.h; j++) {
            pixel = image.data[(image.width * (y + j) + (x + i)) << 2];
            
            if (pixel === 255) {
              col.push('0'); 
            } else if(pixel === 0) {
              col.push('1'); 
            } else {
              col.push('?');
              
              if (validateImageSize(image) === true) {
                throw 'Invalid image format or color palette.';  
              } else {
                throw 'Invalid image size.';
              }
            }
          }
          fragment.push('0x' + binToHex(col.reverse().join('')).result);
        }
        batches.push(fragment);
      }
    }
    
    /**
     * @sync
     * Shortcut minification function. 
     * Returns value only if configuration `minify` is disabled.
     * Otherwise returns empty string.
     * 
     * @param   {Object}        val value
     * @returns {Object|String} @see description for more
     */
    function _min (val) {
      return argv.minify === true ? '' : val;
    };
    
    output = [
      'static const unsigned int ',
      argv.output,
      '_width = ',
      image.width / batchSize.w,
      ';\r\n',
      'static const unsigned int ',
      argv.output,
      '_height = ',
      image.height / batchSize.h,
      ';\r\n',
      'static const byte ',
      argv.output,
      '[][',
      batchSize.w,
      '] = {',
      _min('\r\n')
    ];
    
    for (i = 0; i < batches.length; i++) {
      output.push(_min('  '), '{');
      for (j = 0; j < batchSize.w; j++) {
        if (j > 0) {
          output.push(',', _min(' ')); 
        }
        output.push(batches[i][j]);
      }
      output.push('}', i < batches.length - 1 ? ',' : '' , _min('\r\n'));
    }
    output.push('};');
    
    saveFile(output.join(''));
    
    if (argv.preview) {
      savePreviewFile(image); 
    }
  };
  
  /**
   * @async
   * @callback then
   * 
   * Check if directory exists, create it if necessary.
   * 
   * @param {String}   dir  directory name
   * @param {Function} then callback
   */
  function checkDir (dir, then) {
    if (typeof then !== 'function') {
      then = function () {}; 
    }
    
    fs.mkdir(dir, function (err) {
      if (err && err.code !== 'EEXIST') {
        throw err;
      }
      then();
    });
  };
  
  /**
   * @async
   * 
   * Save preview file in the configured directory.
   * Closes imageStream.
   * 
   * @param {Object} imageStream image stream created via node-png
   */
  function savePreviewFile (imageStream) {
    log('saving preview image to', argv.previewDir);
    
    checkDir(argv.previewDir, function () {
      imageStream.pack()
        .pipe(fs.createWriteStream(argv.previewDir + '/' + argv.output + '.' + argv.previewExt));
    });
  };
  
  /**
   * @async
   * @callback finish
   * 
   * Save output file in the configured directory.
   * 
   * @param {String} outputData output data
   */
  function saveFile (outputData) {
    log('saving converted data to', argv.outputDir);
    
    checkDir(argv.outputDir, function () {
      fs.writeFile(
        argv.outputDir + '/' + argv.output + '.' + argv.outputExt,
        outputData,
        function (err) {
          if (err) {
            throw err;
          }

          finish();
        }
      );
    });
  };
  
  /**
   * @sync
   * @callback callback
   * 
   * Finalize the module.
   */
  function finish () {
    log('finished conversion of ', argv.input);
    
    callback();
  };
  
  /**
   * @async
   * @callback callback
   * 
   * Handle all thrown exceptions from the module.
   */
  function handleExceptions () {
    process.on('uncaughtException', function (err) {
      log('ERR:', err);

      callback(err);
    });
  };
  
  /*
   * Module initialization
   */
  checkCallback();
  handleExceptions();
  applyConfig(config || argv.config, function (result) {
    assign(argv, result);

    run(argv.input);
  });
};
