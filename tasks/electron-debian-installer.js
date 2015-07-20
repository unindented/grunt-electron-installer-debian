'use strict';

var _ = require('lodash');
var asar = require('asar');
var async = require('async');
var child = require('child_process');
var fs = require('fs-extra');
var fsize = require('get-folder-size');
var glob = require('glob');
var path = require('path');
var temp = require('temp').track();
var wrap = require('word-wrap');

/**
 * Spawn a child process.
 */
var spawn = function (command, args, callback) {
  var spawnedProcess = null;
  var error = null;
  var stderr = '';

  try {
    spawnedProcess = child.spawn(command, args);
  }
  catch (err) {
    process.nextTick(function () {
      callback(err, stderr);
    });
    return;
  }

  spawnedProcess.stderr.on('data', function (data) {
    stderr += data;
  });

  spawnedProcess.on('error', function (err) {
    error = error || err;
  });

  spawnedProcess.on('close', function (code, signal) {
    if (code !== 0) {
      error = error || signal || code;
    }

    callback(error && new Error('Error executing command (' + (error.message || error) + '): ' +
      '\n' + command + ' ' + args.join(' ') + '\n' + stderr));
  });
};

/**
 * Read `package.json` either from `resources.app.asar` (if the app is packaged)
 * or from `resources/app/package.json` (if it is not).
 */
var readPackage = function (options, callback) {
  var withAsar = path.join(options.src, 'resources/app.asar');
  var withoutAsar = path.join(options.src, 'resources/app/package.json');

  try {
    if (fs.existsSync(withAsar)) {
      callback(null, JSON.parse(asar.extractFile(withAsar, 'package.json')));
    }
    else {
      callback(null, fs.readJsonSync(withoutAsar));
    }
  }
  catch (err) {
    callback(new Error('Error reading package: ' + (err.message || err)));
  }
};

/**
 * Read `LICENSE` from the root of the app.
 */
var readLicense = function (options, callback) {
  fs.readFile(path.join(options.src, 'LICENSE'), callback);
};

/**
 * Get the size of the app.
 */
var getSize = function (options, callback) {
  fsize(options.src, callback);
};

/**
 * Get the hash of default options for the Grunt task. Some come from the info
 * read from `package.json`, and some are hardcoded.
 */
var getDefaults = function (task, callback) {
  async.parallel([
    async.apply(readPackage, {src: task.data.src}),
    async.apply(getSize, {src: task.data.src})
  ], function (err, results) {
    var pkg = results[0] || {};
    var size = results[1] || 0;

    var defaults = {
      name: pkg.name || 'electron',
      productName: pkg.productName || pkg.name,
      genericName: pkg.genericName || pkg.productName || pkg.name,
      description: pkg.description,
      productDescription: pkg.productDescription || pkg.description,
      version: pkg.version || '0.0.0',
      revision: pkg.revision || '1',

      section: 'utils',
      priority: 'optional',
      arch: undefined,
      size: Math.ceil(size / 1024),

      depends: [
        'git',
        'gconf2',
        'gconf-service',
        'gvfs-bin',
        'libc6',
        'libcap2',
        'libgtk2.0-0',
        'libudev0 | libudev1',
        'libgcrypt11 | libgcrypt20',
        'libnotify4',
        'libnss3',
        'libxtst6',
        'python',
        'xdg-utils'
      ],
      recommends: [
        'lsb-release'
      ],
      suggests: [
        'gir1.2-gnomekeyring-1.0',
        'libgnome-keyring0'
      ],
      enhances: [
      ],
      preDepends: [
      ],

      maintainer: pkg.author && (typeof pkg.author === 'string' ?
        pkg.author.replace(/\s+\([^)]+\)/, '') :
        pkg.author.name +
        (pkg.author.email != null ? ' <' + pkg.author.email + '>' : '')
      ),

      homepage: pkg.homepage || (pkg.author && (typeof pkg.author === 'string' ?
        pkg.author.replace(/.*\(([^)]+)\).*/, '$1') :
        pkg.author.url
      )),

      bin: pkg.name || 'electron',
      icon: path.resolve(__dirname, '../resources/icon.png'),

      categories: [
        'GNOME',
        'GTK',
        'Utility'
      ],

      lintianOverrides: [
      ]
    };

    callback(err, defaults);
  });
};

/**
 * Get the hash of options for the Grunt task.
 */
var getOptions = function (task, defaults, callback) {
  var options = task.options(defaults);

  // Put `src` and `dest` in `options` to make it easier to pass them around.
  options.src = task.data.src;
  options.dest = task.data.dest;

  // Wrap the extended description to avoid lintian warning about
  // `extended-description-line-too-long`.
  options.productDescription = wrap(options.productDescription, {width: 80, indent: ' '});

  callback(null, options);
};

/**
 * Fill in a template with the hash of options.
 */
var generateTemplate = function (file, options, callback) {
  async.waterfall([
    async.apply(fs.readFile, file),
    function (template, callback) {
      callback(null, _.template(template)(options));
    }
  ], callback);
};

/**
 * Create the control file for the package.
 *
 * See: https://www.debian.org/doc/debian-policy/ch-controlfields.html
 */
var createControl = function (options, dir, callback) {
  var controlSrc = path.resolve(__dirname, '../resources/control.ejs');
  var controlDest = path.join(dir, 'DEBIAN/control');

  async.waterfall([
    async.apply(generateTemplate, controlSrc, options),
    async.apply(fs.outputFile, controlDest)
  ], function (err) {
    callback(err && new Error('Error creating control file: ' + (err.message || err)));
  });
};

/**
 * Create the binary for the package.
 */
var createBinary = function (options, dir, callback) {
  var binDir = path.join(dir, 'usr/bin');
  var binSrc = path.join('../share', options.name, options.bin);
  var binDest = path.join(binDir, options.name);

  async.waterfall([
    async.apply(fs.ensureDir, binDir),
    async.apply(fs.symlink, binSrc, binDest, 'file')
  ], function (err) {
    callback(err && new Error('Error creating binary file: ' + (err.message || err)));
  });
};

/**
 * Create the desktop file for the package.
 *
 * See: http://standards.freedesktop.org/desktop-entry-spec/latest/
 */
var createDesktop = function (options, dir, callback) {
  var desktopSrc = path.resolve(__dirname, '../resources/desktop.ejs');
  var desktopDest = path.join(dir, 'usr/share/applications', options.name + '.desktop');

  async.waterfall([
    async.apply(generateTemplate, desktopSrc, options),
    async.apply(fs.outputFile, desktopDest)
  ], function (err) {
    callback(err && new Error('Error creating desktop file: ' + (err.message || err)));
  });
};

/**
 * Create icon for the package.
 */
var createIcon = function (options, dir, callback) {
  var iconFile = path.join(dir, 'usr/share/pixmaps', options.name + '.png');

  fs.copy(options.icon, iconFile, function (err) {
    callback(err && new Error('Error creating icon file: ' + (err.message || err)));
  });
};

/**
 * Create copyright for the package.
 */
var createCopyright = function (options, dir, callback) {
  var copyrightFile = path.join(dir, 'usr/share/doc', options.name, 'copyright');

  async.waterfall([
    async.apply(readLicense, options),
    async.apply(fs.outputFile, copyrightFile)
  ], function (err) {
    callback(err && new Error('Error creating copyright file: ' + (err.message || err)));
  });
};

/**
 * Create lintian overrides for the package.
 */
var createOverrides = function (options, dir, callback) {
  var overridesSrc = path.resolve(__dirname, '../resources/overrides.ejs');
  var overridesDest = path.join(dir, 'usr/share/lintian/overrides', options.name);

  async.waterfall([
    async.apply(generateTemplate, overridesSrc, options),
    async.apply(fs.outputFile, overridesDest)
  ], function (err) {
    callback(err && new Error('Error creating lintian overrides file: ' + (err.message || err)));
  });
};

/**
 * Copy the application into the package.
 */
var createApplication = function (options, dir, callback) {
  var applicationDir = path.join(dir, 'usr/share', options.name);

  async.waterfall([
    async.apply(fs.ensureDir, applicationDir),
    async.apply(fs.copy, options.src, applicationDir)
  ], function (err) {
    callback(err && new Error('Error copying application directory: ' + (err.message || err)));
  });
};

/**
 * Create temporary directory where the contents of the package will live.
 */
var createDir = function (options, callback) {
  async.waterfall([
    async.apply(temp.mkdir, 'electron-'),
    function (dir, callback) {
      dir = path.join(dir, options.name + '_' + options.version + '_' + options.arch);
      fs.ensureDir(dir, callback);
    }
  ], function (err, dir) {
    callback(err && new Error('Error creating temporary directory: ' + (err.message || err)), dir);
  });
};

/**
 * Create the contents of the package.
 */
var createContents = function (options, dir, callback) {
  async.parallel([
    async.apply(createControl, options, dir),
    async.apply(createBinary, options, dir),
    async.apply(createDesktop, options, dir),
    async.apply(createIcon, options, dir),
    async.apply(createCopyright, options, dir),
    async.apply(createOverrides, options, dir),
    async.apply(createApplication, options, dir)
  ], function (err) {
    callback(err, dir);
  });
};

/**
 * Package everything using `dpkg` and `fakeroot`.
 */
var createPackage = function (options, dir, callback) {
  spawn('fakeroot', ['dpkg-deb', '--build', dir], function (err) {
    callback(err, dir);
  });
};

/**
 * Move the package to the specified destination.
 */
var movePackage = function (options, dir, callback) {
  var packagePattern = path.join(dir, '../*.deb');
  async.waterfall([
    async.apply(glob, packagePattern),
    function (files, callback) {
      fs.move(files[0], options.dest, {clobber: true}, callback);
    }
  ], function (err) {
    callback(err && new Error('Error moving package: ' + (err.message || err)), dir);
  });
};

/******************************************************************************/

module.exports = function (grunt) {
  grunt.registerMultiTask('electron-debian-installer',
                          'Create a Debian package for your Electron app.', function () {
    var done = this.async();

    grunt.log.writeln('Creating package (this may take a while)');

    async.waterfall([
      async.apply(getDefaults, this),
      async.apply(getOptions, this),
      function (options, callback) {
        async.waterfall([
          async.apply(createDir, options),
          async.apply(createContents, options),
          async.apply(createPackage, options),
          async.apply(movePackage, options)
        ], function (err) {
          callback(err, options);
        });
      }
    ], function (err, options) {
      if (!err) {
        grunt.log.ok('Successfully created package ' + options.dest);
      }

      done(err);
    });
  });
};
