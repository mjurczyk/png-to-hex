![header](http://mjurczyk.github.io/png-to-hex/pikachu-header.png)

# PNG-to-HEX
> Easily convert PNG images into hexadecimal value batches.

## What
This module might be a Google Plus of npm modules, however for some it might be extremely helpful during small hardware projects, display testing etc.
While working with bare, low level hardware we sometimes want or need to display a complex pixel structure, like a font or image. If you wish to store either of these in your codebase (for example a default system font), it might be tiresome to prepare a hex table for it. This library generates the hex table for you, and presents it in a C-style code, ready for use in your project.

## How it works
![example](http://mjurczyk.github.io/png-to-hex/pikachu-transform-example.png)

At first, module grabs your image and desaturates it. After that, the black&white image is split into a table of batches (or stripes).
Each batch is then carefully transformed into binary numbers, and then once more, into hexadecimal values.
In the end, the final array of hex values is injected into `static const` C variable definition, along with the number of rows and size of each batch.
From that moment you are ready to copy the result, pop it into your code and use in the project.

## How to use it (Stand-alone | Grunt task)

### Prepare image
In order to convert an image, you have to make sure it can be divided into batches. By default, batch size is 5x8<sup>1</sup>. Hance, your image width has to be divisible by 5, and its height has to be divisible by 8 (ex. 45x48). Otherwise, converter may not want to cooperate.

<sup>1</sup> You can configure the batch size with `batchWidth` and `batchHeight` parameters

### Install module
1. First of all, you will need `nodejs` installed on your computer. You can grab the latest version [here](https://nodejs.org/download/). This will install both `node` and `npm` for you.
2. Since you already have `npm`, you can now go to a desired directory, open terminal there and type `npm install png-to-hex`. It will download and install the package.

### Stand-alone command
*(For the sake of example, I'll assume we do everything in the module directory)*
1. In the directory create a `assets` folder and put your 45x48 image inside.
2. In the directory create configuration file `config.json`. Inside of it write:
```json
{
  // Files
  "input": "./assets/image.png",
  "output": "image",
  "outputDir": "./output",
  
  // Don't minify the output
  "minify": false,
  
  // Generate preview files
  "preview": true,
  "previewDir": "./preview",
}
```
3. Now open the terminal console in the directory and type `node node_modules/png-to-hex -c config.json`. 
4. Your output files have been generated and put in `output` directory, a preview of the converted image has been placed in `preview` folder.

### Grunt command<sup>2</sup>
*(For the sake of example, I'll assume we do everything in the module directory)*

The module is also available as a Grunt command, which can really speed up the process of converting due to Grunt's file system nature.

1. In the directory create a `assets` folder and put your 45x48 image(s) inside.
2. In the directory create a `Gruntfile.js`:
```js
module.exports = function (grunt) {
  grunt.initConfig({
    png2hex: {
      options: {
        // Don't minify the output
        minify: false,
        
        // Generate preview files
        preview: true
      },
      convert: {
        src: ['./assets/**/*.png']
      }
    }
  });
  
  grunt.loadTasks('png-to-hex');
  
  grunt.registerTask('default', ['png2hex']);
};
```
3. Now open the terminal console in the directory and type `grunt`.
4. Your output files have been generated and put in `output` directory, a preview of the converted image has been placed in `preview` folder.

<sup>2</sup> If you have never used Grunt before, make sure to check [this](http://gruntjs.com/getting-started) out, or just use the stand-alone version of the module.

## Configuration

Png-to-hex due to its purpose is quite enclosed, but still provides a bunch of configurable options you might want to use one day.

### How to configure PNG-to-HEX
There are total of 3 ways to tell the module what you want to be done. You can either use `config.json` file and pass it via command to the module. You can write configuration in the `Gruntfile.js` task options. Or you can simply write options in the command line, ex:
```bash
node node_modules/png-to-hex -input ./myfile.png -output converted_file -minify -preview -thr 1.5
```
Either way you choose, the effect will be similar. Below you will find the reference notes regarding all possible options.

### Reference

#### config
> Path to the configuration file. If defined, configuration read from the file will override all other settings.

cli: ***-c*** | ***-conf*** | ***-config***
default: ***undefined***

#### input
> Input file(s).

cli: ***-i*** | ***-input*** | ***-f*** | ***-file*** | (last argument passed in cli)
default: ***undefined***
required: ***true***

#### output
> Output name (for both file and hex table variable). This has to be a valid C variable name (module will notify you, if it is not ok).

cli: ***-o*** | ***-output***
default: ***'image'***

#### outputDir
> Output directory.

cli: ***-odir***
default: ***'./output'***

#### outputExt
> Output file extension.

cli: ***-oext***
default: ***'txt'***

#### minify
> If set to true, converter will remove all unnecessary whitespace from the output and present it as a single-line hex table.

cli: ***-min*** | ***-minify***
default: ***false***

#### pngFilter
> [node-png](https://github.com/liangzeng/node-png) filtering value.

cli: ***-flt*** | ***-filter***
default: ***-1***

#### bwThreshold
> Black/white threshold. Converted sums RGB channels for each pixel, and depending on the bwThreshold value, sets the pixel to either black (1) or white (0).

cli: ***-thr*** | ***-threshold***
default: ***1.7***

#### batchWidth
> Batch size. Image width has to be divisible by batchWidth.
> If set to imageWidth, converter will produce stripes instead of batches.

cli: ***-w*** | ***-width***
default: ***5***

#### batchHeight
> Batch size. Batch height usually depends on the application. For 8-bit displays you want to keep it 8. If you display write buffer is 16, 32 etc. you ought to adjust the height.

cli: ***-h*** | ***-height***
default: ***8***

#### preview
> If set to true, transformed images will be saved in the preview directory (useful when you try different bwThreshold values on your images).

cli: ***-p*** | ***-preview***
default: ***false***

#### previewDir
> Preview files directory.

cli: ***-pdir***
default: ***'./preview'***

#### previewExt
> Preview files extension. This does not affect the true extension of the file, which will still be a png.

cli: ***-pext***
default: ***'png'***

## Sample implementation
This is a sample implementation of the final hex table and Nokia 5110 display:

```C
/*
 * Png-to-hex output
 */
static const unsigned int image_width = 4;
static const unsigned int image_height = 4;
static const byte image[][4] = {{ ... }};

/*
 * Write data to the display.
 * @param  dc    data/!command switch
 * @param  data  output value
 */
void dWrite (byte dc, byte data) {
  digitalWrite(PIN_DC, dc);
  
  digitalWrite(PIN_SCE, LOW);
  shiftOut(PIN_SDIN, PIN_SCLK, MSBFIRST, data);
  digitalWrite(PIN_SCE, HIGH); 
}

/*
 * Set cursor position on display.
 * @param  x  horizontal position
 * @param  y  vertical position
 */
void dPos (unsigned int x, unsigned int y) {
  dWrite(0, 0x80 | x);
  dWrite(0, 0x40 | y);
}

/*
 * Draw image on display.
 * @param  image  hex table
 * @param  width  # vertical segments
 * @param  height # horizontal segments
 */
void dDraw (const byte image[][4], int width, int height) {
  int y;
  int x;
  int col;
  
  for (y = 0; y < height; y++) {
    dPos(0, y);
    for (x = 0; x < width; x++) {
      for (col = 0; col < 4; col++) {
        dWrite(LCD_D, image[x + y * width][col]);
      }
    }
  }
}

/* ... */

dDraw(image, image_width, image_height);
```

## Licence

MIT :octocat:
