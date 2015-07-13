# grunt-electron-debian-installer [![Version](https://img.shields.io/npm/v/grunt-electron-debian-installer.svg)](https://www.npmjs.com/package/grunt-electron-debian-installer) [![Build Status](https://img.shields.io/travis/unindented/grunt-electron-debian-installer.svg)](http://travis-ci.org/unindented/grunt-electron-debian-installer) [![Dependency Status](https://img.shields.io/gemnasium/unindented/grunt-electron-debian-installer.svg)](https://gemnasium.com/unindented/grunt-electron-debian-installer)

> Create a Debian package for your Electron app.


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
grunt.loadNpmTasks('grunt-electron-debian-installer');
```

*This plugin was designed to work with Grunt 0.4.x. If you're still using grunt v0.3.x it's strongly recommended that [you upgrade](http://gruntjs.com/upgrading-from-0.3-to-0.4), but in case you can't please use [v0.3.2](https://github.com/gruntjs/grunt-contrib-copy/tree/grunt-0.3-stable).*


## Installer task

_Run this task with the `grunt electron-debian-installer` command._

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

### Usage

To create a `.deb` package from your app:

```js
'electron-debian-installer': {
  app: {
    options: {
      arch: 'i386'
    },
    src: 'path/to/app/',
    dest: 'path/to/out/app_0.0.1_i386.deb'
  }
}
```

To create different packages for different architectures:

```js
'electron-debian-installer': {
  options: {
    productName: 'Foo',
    productDescription: 'Bar baz qux.',
    section: 'devel',
    priority: 'optional',
    lintianOverrides: [
      'changelog-file-missing-in-native-package',
      'executable-not-elf-or-script',
      'extra-license-file'
    ],
    categories: [
      'Utility'
    ]
  },

  linux32: {
    options: {
      arch: 'i386'
    },
    src: 'path/to/linux32/',
    dest: 'path/to/out/app_0.0.1_i386.deb'
  },

  linux64: {
    options: {
      arch: 'amd64'
    },
    src: 'path/to/linux64/',
    dest: 'path/to/out/app_0.0.1_amd64.deb'
  }
}
```

### Options

#### options.name
Type: `String`
Default: `package.name`

Name of the package (e.g. `atom`), used in the [`Package` field of the `control` specification](https://www.debian.org/doc/debian-policy/ch-controlfields.html#s-f-Package).

According to the *Debian Policy Manual*:

> Package names [...] must consist only of lower case letters (a-z), digits (0-9), plus (+) and minus (-) signs, and periods (.). They must be at least two characters long and must start with an alphanumeric character.

#### options.productName
Type: `String`
Default: `package.productName || package.name`

Name of the application (e.g. `Atom`), used in the [`Name` field of the `desktop` specification](http://standards.freedesktop.org/desktop-entry-spec/desktop-entry-spec-latest.html).

#### options.genericName
Type: `String`
Default: `package.genericName || package.productName || package.name`

Generic name of the application (e.g. `Text Editor`), used in the [`GenericName` field of the `desktop` specification](http://standards.freedesktop.org/desktop-entry-spec/desktop-entry-spec-latest.html).

#### options.description
Type: `String`
Default: `package.description`

Short description of the application, used in the [`Description` field of the `control` specification](https://www.debian.org/doc/debian-policy/ch-controlfields.html#s-f-Description).

#### options.productDescription
Type: `String`
Default: `package.productDescription || package.description`

Long description of the application, used in the [`Description` field of the `control` specification](https://www.debian.org/doc/debian-policy/ch-controlfields.html#s-f-Description).

#### options.version
Type: `String`
Default: `package.version`

Version number of the package, used in the [`Version` field of the `control` specification](https://www.debian.org/doc/debian-policy/ch-controlfields.html#s-f-Version).

#### options.section
Type: `String`
Default: `"utils"`

Application area into which the package has been classified, used in the [`Section` field of the `control` specification](https://www.debian.org/doc/debian-policy/ch-controlfields.html#s-f-Section).

You can read more about [sections](https://www.debian.org/doc/debian-policy/ch-archive.html#s-subsections), and also check out the [list of existing sections in Debian unstable](https://packages.debian.org/unstable/).

#### options.priority
Type: `String`
Default: `"optional"`

How important it is that the user have the package installed., used in the [`Priority` field of the `control` specification](https://www.debian.org/doc/debian-policy/ch-controlfields.html#s-f-Priority).

You can read more about [priorities](https://www.debian.org/doc/debian-policy/ch-archive.html#s-priorities).

#### options.arch
Type: `String`
Default: `undefined`

Machine architecture the package is targeted to, used in the [`Architecture` field of the `control` specification](https://www.debian.org/doc/debian-policy/ch-controlfields.html#s-f-Architecture).

For possible values see the output of `dpkg-architecture -L`.

#### options.size
Type: `Integer`
Default: `size of the folder`

Estimate of the total amount of disk space required to install the named package, used in the [`Installed-Size` field of the `control` specification](https://www.debian.org/doc/debian-policy/ch-controlfields.html#s-f-Installed-Size).

#### options.depends et al
Type: `Array[String]`
Default: `[]`

Relationships to other packages, used in the [`Depends`, `Recommends`, `Suggests`, `Enhances` and `Pre-Depends` fields of the `control` specification](https://www.debian.org/doc/debian-policy/ch-relationships.html#s-binarydeps).

#### options.maintainer
Type: `String`
Default: `package.author.name (package.author.email)`

Maintainer of the package, used in the [`Maintainer` field of the `control` specification](https://www.debian.org/doc/debian-policy/ch-controlfields.html#s-f-Maintainer).

#### options.homepage
Type: `String`
Default: `package.author.url`

URL of the homepage for the package, used in the [`Homepage` field of the `control` specification](https://www.debian.org/doc/debian-policy/ch-controlfields.html#s-f-Homepage).

#### options.bin
Type: `String`
Default: `package.name`

Relative path to the executable that will act as binary for the application, used in the [`Exec` field of the `desktop` specification](http://standards.freedesktop.org/desktop-entry-spec/desktop-entry-spec-latest.html).

The generated package will contain a symlink `/usr/bin/<%= options.name %>` pointing to the path provided here.

For example, providing this configuration:

```js
{
  options: {
    name: 'foo',
    bin: 'resources/cli/launcher.sh'
  },
  src: '...',
  dest: '...'
}
```

Will create a package with the following symlink:

```
usr/bin/foo@ -> ../share/foo/resources/cli/launcher/sh
```

And a desktop specification with the following `Exec` key:

```
Exec=foo %U
```

#### options.icon
Type: `String`
Default: `undefined`

Path to the image that will act as icon for the application, used in the [`Icon` field of the `desktop` specification](http://standards.freedesktop.org/desktop-entry-spec/desktop-entry-spec-latest.html).

#### options.categories
Type: `Array[String]`
Default: `[]`

Categories in which the application should be shown in a menu, used in the [`Categories` field of the `desktop` specification](http://standards.freedesktop.org/desktop-entry-spec/desktop-entry-spec-latest.html).

For possible values check out the [Desktop Menu Specification](http://standards.freedesktop.org/menu-spec/latest/apa.html).

#### options.lintianOverrides
Type: `Array[String]`
Default: `[]`

You can use these to quieten [`lintian`](https://lintian.debian.org/manual/).


## Meta

* Code: `git clone git://github.com/unindented/grunt-electron-debian-installer.git`
* Home: <https://github.com/unindented/grunt-electron-debian-installer/>


## Contributors

* Daniel Perez Alvarez ([unindented@gmail.com](mailto:unindented@gmail.com))


## License

Copyright (c) 2015 Daniel Perez Alvarez ([unindented.org](https://unindented.org/)). This is free software, and may be redistributed under the terms specified in the LICENSE file.
