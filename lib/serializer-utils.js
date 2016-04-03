'use strict';
var _ = require('lodash');
var Inflector = require('./inflector');

module.exports = function (collectionName, record, payload, opts) {
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

  function getId() {
    return opts.id || 'id';
  }

  function getRef(current, item, opts) {
    if (_.isFunction(opts.ref)) {
      return opts.ref(current, item);
    } else {
      return String(item[opts.ref]);
    }
  }

  function getType(str, attrVal) {
    var type = str;
    attrVal = attrVal || {};

    if (_.isFunction(opts.typeForAttribute)) {
      type = opts.typeForAttribute(str, attrVal);
    } else if (_.isUndefined(opts.pluralizeType) || opts.pluralizeType) {
      type = Inflector.pluralize(type);
    }

    return type;
  }

  function getLinks(current, links, dest, opts) {
    return _.mapValues(links, function (value) {
      if (_.isFunction(value)) {
        return value(record, current, dest, opts);
      } else {
        return value;
      }
    });
  }

  function getMeta(current, meta) {
    return _.mapValues(meta, function (value) {
      if (_.isFunction(value)) {
        return value(record, current);
      } else {
        return value;
      }
    });
  }

  function pick(obj, attributes) {
    return _.mapKeys(_.pick(obj, attributes), function (value, key) {
      return keyForAttribute(key);
    });
  }

  function isComplexType(obj) {
    return _.isArray(obj) || _.isPlainObject(obj);
  }

  function isCompoundDocumentIncluded(included, item) {
    return _.find(payload.included, { id: item.id, type: item.type });
  }

  function pushToIncluded(dest, include) {
    if (!isCompoundDocumentIncluded(dest, include)) {
      if (!dest.included) { dest.included = []; }
      dest.included.push(include);
    }
  }

  this.serialize = function (dest, current, attribute, opts, serializeOpts) {
    var that = this;

    if (isComplexType(current[attribute])) {
      if (opts && opts.ref) {
        // Embedded with relationships.
        if (!dest.relationships) { dest.relationships = {}; }

        var data = null;
        if (_.isArray(current[attribute])) {
          data = current[attribute].map(function (item) {
            return that.serializeRef(item, current, attribute, opts, serializeOpts);
          });
        } else if (_.isPlainObject(current[attribute])) {
          data = that.serializeRef(current[attribute], current, attribute,
            opts, serializeOpts);
        }

        dest.relationships[keyForAttribute(attribute)] = {};
        if (!opts.ignoreRelationshipData) {
          dest.relationships[keyForAttribute(attribute)].data = data;
        }

        if (opts.relationshipLinks) {
          dest.relationships[keyForAttribute(attribute)].links =
            getLinks(current[attribute], opts.relationshipLinks, dest, serializeOpts);
        }

        if (opts.relationshipMeta) {
          dest.relationships[keyForAttribute(attribute)].meta =
            getMeta(current[attribute], opts.relationshipMeta);
        }
      } else {
        var data = null;
        if (_.isArray(current[attribute])) {
          if (current[attribute].length && _.isPlainObject(current[attribute][0])) {
            data = current[attribute].map(function (item) {
              return that.serializeNested(item, current, attribute, opts);
            });
          } else {
            data = current[attribute];
          }
        } else if (_.isPlainObject(current[attribute])) {
          data = that.serializeNested(current[attribute], current, attribute, opts);
        }

        dest.attributes[keyForAttribute(attribute)] = data;
      }
    } else {
      dest.attributes[keyForAttribute(attribute)] = current[attribute];
    }
  };

  this.serializeRef = function (dest, current, attribute, opts, serializeOpts) {
    var that = this;
    var id = getRef(current, dest, opts);
    var type = getType(attribute, dest);
    if (opts.type) {
      type = getType(opts.type, dest);
    }

    var relationships = [];
    var includedAttrs = [];

    if (opts.attributes) {
      relationships = opts.attributes.filter(function (attr) {
        return opts[attr];
      });

      includedAttrs = opts.attributes.filter(function (attr) {
        return !opts[attr];
      });
    }

    var included = { type: type, id: id };
    if (includedAttrs) { included.attributes = pick(dest, includedAttrs); }

    relationships.forEach(function (relationship) {
      if (isComplexType(dest[relationship])) {
        that.serialize(included, dest, relationship, opts[relationship]);
      }
    });

    if (_.isUndefined(opts.included) || opts.included) {
      if (opts.includedLinks) {
        included.links = getLinks(dest, opts.includedLinks, included, serializeOpts);
      }

      pushToIncluded(payload, included);
    }

    return id !== 'undefined' ? { type: type, id: id } : null;
  };

  this.serializeNested = function (dest, current, attribute, opts) {
    var that = this;

    var embeds = [];
    var attributes = [];

    if (opts && opts.attributes) {
      embeds = opts.attributes.filter(function (attr) {
        return opts[attr];
      });

      attributes = opts.attributes.filter(function (attr) {
        return !opts[attr];
      });
    } else {
      attributes = _.keys(dest);
    }

    var ret = {};
    if (attributes) { ret.attributes = pick(dest, attributes); }

    embeds.forEach(function (embed) {
      if (isComplexType(dest[embed])) {
        that.serialize(ret, dest, embed, opts[embed]);
      }
    });

    return ret.attributes;
  };

  this.perform = function (serializeOpts) {
    var that = this;

    if( _.isNull( record ) ){
        return null;
    }

    // Top-level data.
    var data = {
      type: getType(collectionName),
      id: String(record[getId()])
    };

    // Data links.
    if (opts.dataLinks) {
      data.links = getLinks(record, opts.dataLinks, data, serializeOpts);
    }

    _.each(opts.attributes, function (attribute) {
      if (attribute in record) {
        if (!data.attributes) { data.attributes = {}; }
        that.serialize(data, record, attribute, opts[attribute], serializeOpts);
      } else {
        return;
      }
    });

    return data;
  };
};
