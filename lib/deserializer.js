'use strict';
var _ = require('lodash');
var inflection = require('inflection');
var SerializerUtils = require('./serializer-utils');

// {
//   "data": {
//     "attributes": {
//       "order-type": "subscription",
//       "production-state": "0",
//       "payment-state": "0",
//       "shipment-state": "0",
//       "created-at": null,
//       "ship-date": null,
//       "season": "FA15"
//     },
//     "relationships": {
//       "plan": {
//         "data": {
//           "type": "plans",
//           "id": "1-shirt"
//         }
//       },
//       "coupon": {
//         "data": null
//       },
//       "address": {
//         "data": null
//       },
//       "customer": {
//         "data": null
//       }
//     },
//     "type": "orders"
//   }
// }

var DeSerializer = new SerializerUtils('', null, null, {
  keyForAttribute: 'CamelCase'
});

module.exports = function (collectionName, payload) {
  var attributes = payload.data.attributes;
  var relationships = payload.data.relationships;

  var relations = Object.keys(relationships);
  var collectionAttrs = {};
  Object.keys(attributes).forEach(function (key) {
    collectionAttrs[_.camelCase(key)] = _.clone(attributes[key], true);
  });
  var collection = new collectionName(collectionAttrs);
  // console.log('COLLECTION: ', attributes);

  relations.forEach(function (relation) {
    // (e.g 1)
    // "relationships": {
    //   "plan": {
    //     "data": {
    //       "type": "plans",
    //       "id": "1-shirt"
    //     }
    //   }
    // }
    // (e.g 2)
    // "relationships": {
    //   "coupon": {
    //     "data": null
    //   }
    // }
    var relationshipPayload = relationships[relation];
    var relationshipData = relationshipPayload.data;
    // relationType => Plan
    if (!relationshipData) {
      return;
    }
    if (_.isArray(relationshipData)) {
      // TODO:
      // Order.products = [Product.new(...), Product.new(...), Product.new(...)];
      collection[_.camelCase(relation)] = _.map(relationshipData, function (relationData) {
        return _.omit(relationData, 'type');
      });
    } else {
      // Plan.new({ id: '1-shirt' });
      var relationObject = _.omit(relationshipData, 'type');
      // Order.plan = Plan.new({ id: '1-shirt' });
      collection[_.camelCase(relation)] = relationObject;
    }
  });
  return collection;
};

// var newOrder = JSONAPIDeSerializer(Order, req.body);
