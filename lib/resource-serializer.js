'use strict';
var SerializerUtils = require('./serializer-utils');

function ResourceSerializer(payload, collectionName, record, opts) {
  payload.data = new SerializerUtils(collectionName, record, payload, opts)
    .perform(record);

  return payload;
}

module.exports = ResourceSerializer;
