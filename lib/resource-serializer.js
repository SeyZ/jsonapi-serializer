'use strict';
var SerializerUtils = require('./serializer-utils');

function ResourceSerializer(collectionName, record, opts) {
  var payload = { data: {} };

  var serializerUtils = new SerializerUtils(collectionName, record, payload,
    opts);
  if (opts.links) { payload.links = opts.links; }
  payload.data = serializerUtils.perform(record);

  return payload;
}

module.exports = ResourceSerializer;
