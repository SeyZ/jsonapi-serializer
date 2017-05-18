'use strict';
var isPlainObject = require('lodash/isPlainObject');
var isFunction = require('lodash/isFunction');
var _find = require('lodash/find');
var _extend = require('lodash/extend');
var _transform = require('lodash/transform');
var _merge = require('lodash/merge');
var _get = require('lodash/get');
var _set = require('lodash/set');
var Inflector = require('./inflector');

module.exports = function (jsonapi, data, opts) {
  var alreadyIncluded = {};

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

  function findIncluded(relationshipData, relationshipName, from) {
    return new Promise(function (resolve) {
      if (!jsonapi.included || !relationshipData) { return resolve(null); }

      var included = _find(jsonapi.included, {
        id: relationshipData.id,
        type: relationshipData.type
      });

      var path = [
        from.type,
        from.id,
        relationshipName,
        relationshipData.type,
        relationshipData.id,
      ]

      // Check if the include is already processed (prevent circular
      // references).
      if (_get(alreadyIncluded, path, false)) {
        return resolve(null);
      } else {
        _merge(alreadyIncluded, _set({}, path, true));
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
              return extractIncludes(relationshipData, key, from);
            }))
            .then(function (includes) {
              if (includes) { dest[keyForAttribute(key)] = includes; }
            });
        } else {
          return extractIncludes(relationship.data, key, from)
            .then(function (include) {
              if (include) { dest[keyForAttribute(key)] = include; }
            });
        }
      }))
      .then(function() {
        return dest;
      });
  }

  function extractIncludes(relationshipData, relationshipName, from) {
    return findIncluded(relationshipData, relationshipName, from)
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

  this.perform = function () {
    return Promise
      .all([extractAttributes(data), extractRelationships(data)])
      .then(function (results) {
        var attributes = results[0];
        var relationships = results[1];
        var record = _extend(attributes, relationships);

        // Links
        if (jsonapi.links) {
          record.links = jsonapi.links;
        }


        // If option is present, transform record
        if (opts && opts.transform) {
          record = opts.transform(record);
        }

        return record;
      });
  };
};
