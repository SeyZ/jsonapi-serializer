'use strict';
var SerializerUtils = require('./serializer-utils');

function CollectionSerializer(payload, collectionName, records, opts) {
  payload.data = [];

  records.forEach(function (record) {
    var serializerUtils = new SerializerUtils(collectionName, record, payload,
      opts);
    payload.data.push(serializerUtils.perform());
  });

  return payload;
}

module.exports = CollectionSerializer;
