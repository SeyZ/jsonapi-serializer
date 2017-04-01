var http = require('http');
var JSONAPIError = require('./JSONAPIError');

var STATUS_CODE = 404;

module.exports = function (
  detailOrExplicit = '', code = '', id = '', meta = {},
  sourcePointer = '', sourceParameter = '', linksAbout = ''
) {
  return new JSONAPIError(
    STATUS_CODE, detailOrExplicit, code, id, meta, sourcePointer, sourceParameter, linksAbout);
};
