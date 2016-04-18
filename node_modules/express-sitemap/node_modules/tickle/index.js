'use strict';
/**
 * @file tickle main
 * @module tickle
 * @subpackage main
 * @version 1.2.0
 * @author hex7c0 <hex7c0@gmail.com>
 * @copyright hex7c0 2014
 * @license GPLv3
 */

/*
 * initialize module
 */
if (!global.tickle) {
  global.tickle = new Tickle();
}

/*
 * functions
 */
/**
 * tickle class
 * 
 * @class Tickle
 */
function Tickle() {

  this.all = 0;
  this.time = [ process.hrtime(), 0 ];
  this.route = Object.create(null);
}

/**
 * reset all routing counter
 * 
 * @function reset
 */
Tickle.prototype.reset = function() {

  this.all = 0;
  this.route = Object.create(null);
  return;
};

/**
 * increase counter
 * 
 * @function add
 * @param {String} path - url path
 * @return {Integer}
 */
Tickle.prototype.add = function(path) {

  ++this.all;
  var plus;
  if (this.route[path] !== undefined) {
    plus = ++this.route[path];
  } else {
    plus = this.route[path] = 1;
  }
  return plus;
};

/**
 * time per request
 * 
 * @function tpr
 * @return {Float}
 */
Tickle.prototype.tpr = function() {

  var time = this.time;
  var all = this.all;
  var diff = process.hrtime(time[0]);
  this.time = [ process.hrtime(), all ];
  return ((diff[0] * 1e9 + diff[1]) / 1e6) / (all - time[1]);
};

/**
 * main
 * 
 * @exports tickle
 * @function tickle
 * @param {Object} req - client request
 * @param {Object} [res] - response to client
 * @param {next} [next] - continue routes
 * @return {Integer|Functions}
 */
function tickle(req, res, next) {

  req.tickle = global.tickle.add(req.url);
  return next !== undefined ? next() : req.tickle;
}
module.exports = tickle;
