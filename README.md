# grunt-electron-debian-installer [![Version](https://img.shields.io/npm/v/grunt-electron-debian-installer.svg)](https://www.npmjs.com/package/grunt-electron-debian-installer) [![Build Status](https://img.shields.io/travis/unindented/grunt-electron-debian-installer.svg)](http://travis-ci.org/unindented/grunt-electron-debian-installer) [![Dependency Status](https://img.shields.io/gemnasium/unindented/grunt-electron-debian-installer.svg)](https://gemnasium.com/unindented/grunt-electron-debian-installer)

> Create a Debian package for your Electron app.

Not a fan of [Grunt](http://gruntjs.com/)? Use the vanilla module [`electron-installer-debian`](https://github.com/unindented/electron-installer-debian)!


## Requirements

This tool requires `fakeroot` and `dpkg` to build the `.deb` package.

I'd recommend building your packages on your target platform, but if you insist on using Mac OS X, you can install these tools through [Homebrew](http://brew.sh/):

```
$ brew install fakeroot dpkg
```


## Getting Started

This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-electron-debian-installer --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-electron-debian-installer')
```

*This plugin was designed to work with Grunt 0.4.x. If you're still using grunt v0.3.x it's strongly recommended that [you upgrade](http://gruntjs.com/upgrading-from-0.3-to-0.4), but in case you can't please use [v0.3.2](https://github.com/gruntjs/grunt-contrib-copy/tree/grunt-0.3-stable).*


## Installer task

_Run this task with the `grunt electron-debian-installer` command._

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

### Usage

Say your Electron app lives in `path/to/app`, and has a structure like this:

```
.
├── LICENSE
├── README.md
├── node_modules
│   ├── electron-packager
│   └── electron-prebuilt
├── package.json
├── resources
│   ├── Icon.png
│   ├── IconTemplate.png
│   └── IconTemplate@2x.png
└── src
    ├── index.js
    ├── main
    │   └── index.js
    └── renderer
        ├── index.html
        └── index.js
```

You now run `electron-packager` to build the app for Debian:

```
$ electron-packager . app --platform linux --arch x64 --out dist/
```

And you end up with something like this in your `dist` folder:

```
.
└── dist
    └── app-linux-x64
        ├── LICENSE
        ├── LICENSES.chromium.html
        ├── content_shell.pak
        ├── app
        ├── icudtl.dat
        ├── libgcrypt.so.11
        ├── libnode.so
        ├── locales
        ├── natives_blob.bin
        ├── resources
        ├── snapshot_blob.bin
        └── version
```

In order to create a `.deb` package for your app, the configuration for your Grunt task would look like this:

```js
'electron-debian-installer': {
  app: {
    options: {
      arch: 'amd64'
    },
    src: 'path/to/app/dist/app-linux-x64',
    dest: 'path/to/app/dist/installers/'
  }
}
```

The task will try to extract all necessary information from your `package.json`, and then generate your package at `path/to/app/dist/installers/`.

You can also create different packages for different architectures, while manually overriding certain options:

```js
'electron-debian-installer': {
  options: {
    productName: 'Foo',
    productDescription: 'Bar baz qux.',
    section: 'devel',
    priority: 'optional',
    categories: [
      'Utility'
    ],
    lintianOverrides: [
      'changelog-file-missing-in-native-package',
      'executable-not-elf-or-script',
      'extra-license-file'
    ]
  },

  linux32: {
    options: {
      arch: 'i386'
    },
    src: 'path/to/app/dist/app-linux-ia32',
    dest: 'path/to/app/dist/installers/'
  },

  linux64: {
    options: {
      arch: 'amd64'
    },
    src: 'path/to/app/dist/app-linux-x64',
    dest: 'path/to/app/dist/installers/'
  }
}
```

### Options

See the options supported by [`electron-installer-debian`](https://github.com/unindented/electron-installer-debian#options).


## Meta

* Code: `git clone git://github.com/unindented/grunt-electron-debian-installer.git`
* Home: <https://github.com/unindented/grunt-electron-debian-installer/>


## Contributors

* Daniel Perez Alvarez ([unindented@gmail.com](mailto:unindented@gmail.com))


## License

Copyright (c) 2016 Daniel Perez Alvarez ([unindented.org](https://unindented.org/)). This is free software, and may be redistributed under the terms specified in the LICENSE file.
