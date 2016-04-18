# [tickle](https://github.com/hex7c0/tickle)

[![NPM version](https://img.shields.io/npm/v/tickle.svg)](https://www.npmjs.com/package/tickle)
[![Linux Status](https://img.shields.io/travis/hex7c0/tickle.svg?label=linux)](https://travis-ci.org/hex7c0/tickle)
[![Windows Status](https://img.shields.io/appveyor/ci/hex7c0/tickle.svg?label=windows)](https://ci.appveyor.com/project/hex7c0/tickle)
[![Dependency Status](https://img.shields.io/david/hex7c0/tickle.svg)](https://david-dm.org/hex7c0/tickle)
[![Coveralls](https://img.shields.io/coveralls/hex7c0/tickle.svg)](https://coveralls.io/r/hex7c0/tickle)

Request counter for [nodejs](http://nodejs.org), independent for every route

## Installation

Install through NPM

```bash
npm install tickle
```
or
```bash
git clone git://github.com/hex7c0/tickle.git
```

## API

inside expressjs project
```js
var tickle = require('tickle');

var app = require('express')();

app.use(tickle);
```

Class is stored inside _global_ **Object**.
One istance for environment.
```js
global.tickle;
```

### Methods

reset all counter
```js
global.tickle.reset();
```

get time per request
```js
global.tickle.tpr();
```

routing information are stored inside an **Object**
```js
global.tickle.route;
```

## Examples

Take a look at my [examples](examples)

### [License GPLv3](LICENSE)
