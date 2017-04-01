var http = require('http');

module.exports = function (
  status, detail, code, id,
  meta, sourcePointer, sourceParameter,
  linksAbout
) {
  if (typeof status === 'undefined') {
    status = 500;
  }

  if (typeof detail === 'undefined') {
    detail = '';
  }

  if (typeof code === 'undefined') {
    code = '';
  }

  if (typeof id === 'undefined') {
    id = '';
  }

  if (typeof meta === 'undefined') {
    meta = {};
  }

  if (typeof sourcePointer === 'undefined') {
    sourcePointer = '';
  }

  if (typeof sourceParameter === 'undefined') {
    sourceParameter = '';
  }

  if (typeof linksAbout === 'undefined') {
    linksAbout = '';
  }


  var rawParamObj = null;

  if (typeof status === 'object') {
    rawParamObj = status;
  } else if (typeof detail === 'object') {
    rawParamObj = detail;
  }

  if (rawParamObj !== null) {
    id = rawParamObj.id || '';
    if (Object.prototype.hasOwnProperty.call(rawParamObj, 'links')) {
      linksAbout = rawParamObj.links.about || '';
    }
    status = rawParamObj.status || 500;
    code = rawParamObj.code || '';
    detail = rawParamObj.detail || '';
    if (Object.prototype.hasOwnProperty.call(rawParamObj, 'source')) {
      sourcePointer = rawParamObj.source.pointer || '';
      sourceParameter = rawParamObj.source.parameter || '';
    } else {
      sourcePointer = '';
      sourceParameter = '';
    }
    meta = rawParamObj.meta || {};
  }


  var error = {};

  if (id !== '') {
    error.id = id.toString();
  }

  if (linksAbout !== '') {
    error.links = error.links || {};

    error.links.about = linksAbout;
  }

  error.status = status.toString();

  if (code !== '') {
    error.code = code.toString();
  }

  error.title = http.STATUS_CODES[parseInt(status)];

  if (detail !== '') {
    error.detail = detail.toString();
  }

  if (sourcePointer !== '') {
    error.source = error.source || {};

    error.source.pointer = sourcePointer.toString();
  }
  if (sourceParameter !== '') {
    error.source = error.source || {};

    error.source.parameter = sourceParameter.toString();
  }

  if (Object.getOwnPropertyNames(meta).length !== 0) {
    error.meta = meta;
  }

  return error;
};
