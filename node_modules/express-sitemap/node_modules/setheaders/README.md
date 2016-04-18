# [setheaders](https://github.com/hex7c0/setheaders)

[![NPM version](https://img.shields.io/npm/v/setheaders.svg)](https://www.npmjs.com/package/setheaders)
[![Linux Status](https://img.shields.io/travis/hex7c0/setheaders.svg?label=linux)](https://travis-ci.org/hex7c0/setheaders)
[![Windows Status](https://img.shields.io/appveyor/ci/hex7c0/setheaders.svg?label=windows)](https://ci.appveyor.com/project/hex7c0/setheaders)
[![Dependency Status](https://img.shields.io/david/hex7c0/setheaders.svg)](https://david-dm.org/hex7c0/setheaders)
[![Coveralls](https://img.shields.io/coveralls/hex7c0/setheaders.svg)](https://coveralls.io/r/hex7c0/setheaders)

boilerplate for res.setHeader, protection from being overridden and more!

## Installation

Install through NPM

```bash
npm install setheaders
```
or
```bash
git clone git://github.com/hex7c0/setheaders.git
```

## API

inside nodejs project, set `pippo` as "X-Foo" header
```js
var setHeader = require('setheaders');

setHeader(res, 'X-Foo', 'pippo');
```

there are different shortcuts, instead of setting correct argument
```js
var setHeader = require('setheaders');

var setProctedHeader = setHeader.setProctedHeader; // protected = true
var setOverrideHeader = setHeader.setOverrideHeader; // override = true
var setWritableHeader = setHeader.setWritableHeader; // writable = true
```

### setheaders(res, name, value [, protected [, override [, writable] ] ])

#### options

 - `res` - **Object** response to client *(default "required")*
 - `name`- **String** header's name *(default "required")*
 - `value` - **String** header's value *(default "required")*
 - `[protected]` - **true** set protected header, from being overridden before they are written to response *(default "false")*
 - `[override]` - **true** check if I'm trying to override a header *(default "false")*
 - `[writable]` - **true** check if socket is writable, prevent write Error *(default "false")*

## Examples

Take a look at my [examples](examples)

### [License GPLv3](LICENSE)
