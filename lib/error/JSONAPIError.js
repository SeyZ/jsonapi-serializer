var http = require('http');

module.exports = function (
  status = 500, detail = '', code = '', id = '',
  meta = {}, sourcePointer = '', sourceParameter = '',
  linksAbout = ''
) {
  if (typeof detail === 'object') {
    return detail;
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
