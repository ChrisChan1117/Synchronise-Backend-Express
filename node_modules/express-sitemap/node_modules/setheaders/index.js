'use strict';
/**
 * @file setheaders main
 * @module setheaders
 * @subpackage main
 * @version 0.1.0
 * @author hex7c0 <hex7c0@gmail.com>
 * @copyright hex7c0 2014
 * @license GPLv3
 */

/*
 * functions
 */
/**
 * set header on response
 * 
 * @function setHeader
 * @param {Object} res - response to client
 * @param {String} name - header's name
 * @param {String} value - header's value
 * @param {Boolean} [protect] - set protected header
 * @param {Boolean} [override] - check if I'm trying to override a header
 * @param {Boolean} [writable] - check if socket is writable, prevent write Error
 * @return {Boolean}
 */
function setHeader(res, name, value, protect, override, writable) {

  // check an override
  if (override === true) {
    var isPresent = res._headers && res._headers[name] !== undefined;
    if (isPresent === true) {
      return true;
    }
  }
  // I don't care or not found

  // is socket writable?
  if (writable === true) {
    var isWritable = res._headerSent === false || res.finished === false;
    if (isWritable === false) {
      return false;
    }
  }
  // it's dangerous to go alone

  res.setHeader(name, value);

  // do you want to lock this header?
  if (protect === true) {
    var low = name.toLowerCase();
    var previous = Object.getOwnPropertyDescriptor(res._headers, low);
    if (previous !== undefined && previous.configurable === false) { // already defined
      return false;
    }
    Object.defineProperty(res._headers, low, {
      configurable: false,
      enumerable: true,
      get: function() { // getter

        return value;
      },
      set: function() { // setter

        return; // prevent set error
      }
    });
  }
  // okay easy rider

  return true;
}
module.exports = setHeader;

/**
 * set protected header on response
 * 
 * @function setProctedHeader
 * @param {Object} res - response to client
 * @param {String} name - header's name
 * @param {String} value - header's value
 * @return {Boolean}
 */
function setProctedHeader(res, name, value) {

  res.setHeader(name, value);

  var low = name.toLowerCase();
  var previous = Object.getOwnPropertyDescriptor(res._headers, low);

  if (!previous || previous.configurable === true) {
    Object.defineProperty(res._headers, low, {
      configurable: false,
      enumerable: true,
      get: function() { // getter

        return value;
      },
      set: function() { // setter

        return; // prevent set error
      }
    });
    return true;
  }

  return false;
}
module.exports.setProctedHeader = setProctedHeader;

/**
 * set override header on response
 * 
 * @function setOverrideHeader
 * @param {Object} res - response to client
 * @param {String} name - header's name
 * @param {String} value - header's value
 * @return {Boolean}
 */
function setOverrideHeader(res, name, value) {

  if (!res._headers || res._headers[name] === undefined) {
    res.setHeader(name, value);
  }

  return true;
}
module.exports.setOverrideHeader = setOverrideHeader;

/**
 * set writable header on response
 * 
 * @function setWritableHeader
 * @param {Object} res - response to client
 * @param {String} name - header's name
 * @param {String} value - header's value
 * @return {Boolean}
 */
function setWritableHeader(res, name, value) {

  if (res._headerSent === false || res.finished === false) {
    res.setHeader(name, value);
    return true;
  }

  return false;
}
module.exports.setWritableHeader = setWritableHeader;
