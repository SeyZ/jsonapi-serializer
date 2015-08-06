'use strict';
var _ = require('lodash');
var SerializerUtils = require('./serializer-utils');

function ResourceSerializer(collectionName, record, opts) {
  var payload = { data: {} };

  function getLinks(links) {
    return _.mapValues(links, function (value) {
      if (_.isFunction(value)) {
        return value(record);
      } else {
        return value;
      }
    });
  }

  if (opts.topLevelLinks) { payload.links = getLinks(opts.topLevelLinks); }

  var serializerUtils = new SerializerUtils(collectionName, record, payload,
    opts);
  if (opts.links) { payload.links = opts.links; }
  payload.data = serializerUtils.perform(record);

  return payload;
}

module.exports = ResourceSerializer;
