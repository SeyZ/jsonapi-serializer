'use strict';
var _ = require('lodash');
var Inflector = require('./inflector');

module.exports = function (jsonapi, data, opts) {
  var alreadyIncluded = [];

  function isComplexType(obj) {
    return _.isArray(obj) || _.isPlainObject(obj);
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

  function findIncluded(relationshipData) {
    return new Promise(function (resolve) {
      if (!jsonapi.included || !relationshipData) { resolve(null); }

      var included = _.find(jsonapi.included, {
        id: relationshipData.id,
        type: relationshipData.type
      });

      // Check if the include is already processed (prevent circular
      // references).
      if (alreadyIncluded.indexOf(included) > -1) {
        return resolve(null);
      } else {
        alreadyIncluded.push(included);
      }

      if (included) {
        return Promise
          .all([extractAttributes(included), extractRelationships(included)])
          .then(function (results) {
            var attributes = results[0];
            var relationships = results[1];
            resolve(_.extend(attributes, relationships));
          });
      } else {
        return resolve(null);
      }
    });
  }

  function keyForAttribute(attribute) {
    if (_.isPlainObject(attribute)) {
      return _.transform(attribute, function (result, value, key) {
        if (isComplexType(value)) {
          result[keyForAttribute(key)] = keyForAttribute(value);
        } else {
          result[keyForAttribute(key)] = value;
        }
      });
    } else if (_.isArray(attribute)) {
      return attribute.map(function (attr) {
        if (isComplexType(attr)) {
          return keyForAttribute(attr);
        } else {
          return attr;
        }
      });
    } else {
      if (_.isFunction(opts.keyForAttribute)) {
        return opts.keyForAttribute(attribute);
      } else {
        return Inflector.caserize(attribute, opts);
      }
    }
  }

  function extractAttributes(from) {
    var dest = keyForAttribute(from.attributes || {});
    if ('id' in from) { dest.id = from.id; }

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
        } else if (_.isArray(relationship.data)) {
          return Promise
            .all(relationship.data.map(function (relationshipData) {
              return extractIncludes(relationshipData);
            }))
            .then(function (includes) {
              if (includes) { dest[keyForAttribute(key)] = includes; }
            });
        } else {
          return extractIncludes(relationship.data)
            .then(function (include) {
              if (include) { dest[keyForAttribute(key)] = include; }
            });
        }
      }))
      .then(function() {
        return dest;
      });
  }

  function extractIncludes(relationshipData) {
    return findIncluded(relationshipData)
      .then(function (included) {
        var valueForRelationship = getValueForRelationship(relationshipData,
          included);

        if (valueForRelationship && _.isFunction(valueForRelationship.then)) {
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
        return _.extend(attributes, relationships);
      });
  };
};
