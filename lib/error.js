'use strict';
var ErrorUtils = require('./error-utils');

module.exports = function (opts) {
  if (!opts) { opts = []; }

  if (Array.isArray(opts)) {
    return new ErrorUtils(opts);
  } else {
    return new ErrorUtils([opts]);
  }
};

