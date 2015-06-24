'use strict';
var P = require('bluebird');
var SerializerUtils = require('./serializer-utils');

function ResourceSerializer(collectionName, record, opts) {
  var payload = { data: {} };

  var serializerUtils = new SerializerUtils(collectionName, payload, opts);
  if (opts.links) { payload.links = opts.links; }
  payload.data = serializerUtils.perform(record);

  return new P(function (resolve) {
    resolve(payload);
  });
}

module.exports = ResourceSerializer;
