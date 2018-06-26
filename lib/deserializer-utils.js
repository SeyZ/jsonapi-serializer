'use strict';
var _assign = require('lodash/assign');
var isPlainObject = require('lodash/isPlainObject');
var isFunction = require('lodash/isFunction');
var _find = require('lodash/find');
var _extend = require('lodash/extend');
var _transform = require('lodash/transform');
var Inflector = require('./inflector');

module.exports = function (jsonapi, data, opts) {
  var alreadyIncluded = [];

  function isComplexType(obj) {
    return Array.isArray(obj) || isPlainObject(obj);
  }

  function getValueForRelationship(relationshipData, included) {
    if (opts && relationshipData && opts[relationshipData.type]) {
      var valueForRelationshipFct = opts[relationshipData.type]
        .valueForRelationship;

      return valueForRelationshipFct(relationshipData, included);
    } else {
      return included;
    }
  }

  function findIncluded(relationshipData, relationshipKey) {
    return new Promise(function (resolve) {
      if (!jsonapi.included || !relationshipData) { resolve(null); }

      var included = _find(jsonapi.included, {
        id: relationshipData.id,
        type: relationshipData.type
      });

      // Check if the include is already processed (prevent circular
      // references).
      var includedWithKey = _assign({}, included, { relationshipKey: relationshipKey })
      if (_find(alreadyIncluded, includedWithKey)) {
        return resolve(null);
      } else {
        alreadyIncluded.push(includedWithKey);
      }

      if (included) {
        return Promise
          .all([extractAttributes(included), extractRelationships(included)])
          .then(function (results) {
            var attributes = results[0];
            var relationships = results[1];
            resolve(_extend(attributes, relationships));
          });
      } else {
        return resolve(null);
      }
    });
  }

  function keyForAttribute(attribute) {
    if (isPlainObject(attribute)) {
      return _transform(attribute, function (result, value, key) {
        if (isComplexType(value)) {
          result[keyForAttribute(key)] = keyForAttribute(value);
        } else {
          result[keyForAttribute(key)] = value;
        }
      });
    } else if (Array.isArray(attribute)) {
      return attribute.map(function (attr) {
        if (isComplexType(attr)) {
          return keyForAttribute(attr);
        } else {
          return attr;
        }
      });
    } else {
      if (isFunction(opts.keyForAttribute)) {
        return opts.keyForAttribute(attribute);
      } else {
        return Inflector.caserize(attribute, opts);
      }
    }
  }

  function extractAttributes(from) {
    var dest = keyForAttribute(from.attributes || {});
    if ('id' in from) { dest[opts.id || 'id'] = from.id; }

    if (opts.typeAsAttribute) {
      if ('type' in from) { dest.type = from.type; }
    }
    if ('meta' in from) { dest.meta = keyForAttribute(from.meta || {}) }

    return dest;
  }

  function extractRelationships(from) {
    if (!from.relationships) { return; }

    var dest = {};

    return Promise
      .all(Object.keys(from.relationships).map(function (key) {
        var relationship = from.relationships[key];

        if (relationship.data === null) {
          dest[keyForAttribute(key)] = null;
        } else if (Array.isArray(relationship.data)) {
          return Promise
            .all(relationship.data.map(function (relationshipData) {
              return extractIncludes(relationshipData, key);
            }))
            .then(function (includes) {
              if (includes) { dest[keyForAttribute(key)] = includes; }
            });
        } else {
          return extractIncludes(relationship.data, key)
            .then(function (include) {
              if (include) { dest[keyForAttribute(key)] = include; }
            });
        }
      }))
      .then(function() {
        return dest;
      });
  }

  function extractIncludes(relationshipData, relationshipKey) {
    return findIncluded(relationshipData, relationshipKey)
      .then(function (included) {
        var valueForRelationship = getValueForRelationship(relationshipData,
          included);

        if (valueForRelationship && isFunction(valueForRelationship.then)) {
          return valueForRelationship.then(function (value) {
            return value;
          });
        } else {
          return valueForRelationship;
        }
      });
  }

  function extractLinks(data) {
    if ('links' in data) {
      return {links: data['links']}
    }
  }

  this.perform = function () {
    return Promise
      .all([extractAttributes(data), extractRelationships(data), extractLinks(data)])
      .then(function (results) {
        var attributes = results[0];
        var relationships = results[1];
        var links = results[2];
        var record = _extend(attributes, relationships, links);

        // Links
        if (jsonapi.links) {
          record.meta = record.meta || {};
          record.meta.links =  jsonapi.links;
        }

        if (jsonapi.meta) {
          record.meta = record.meta || {};
          Object.assign(record.meta, keyForAttribute(jsonapi.meta));
        }


        // If option is present, transform record
        if (opts && opts.transform) {
          record = opts.transform(record);
        }

        return record;
      });
  };
};
