'use strict';
var isPlainObject = require('lodash/isPlainObject');
var isFunction = require('lodash/isFunction');
var _merge = require('lodash/merge');
var _identity = require('lodash/identity');
var _transform = require('lodash/transform');
var _mapValues = require('lodash/mapValues');
var _mapKeys = require('lodash/mapKeys');
var _pick = require('lodash/pick');
var _pickBy = require('lodash/pickBy');
var _each = require('lodash/each');
var _isNil = require('lodash/isNil');
var _isUndefined = require("lodash/isUndefined");
var Inflector = require('./inflector');

module.exports = function (collectionName, record, payload, opts, includedSet) {
  function isComplexType(obj) {
    return Array.isArray(obj) || isPlainObject(obj);
  }

  function transformFunction(result, value, key) {
    if (isComplexType(value)) {
      result[keyForAttribute(key)] = keyForAttribute(value);
    } else {
      result[keyForAttribute(key)] = value;
    }
  }

  function attributeFunction(attr) {
    if (isComplexType(attr)) {
      return keyForAttribute(attr);
    } else {
      return attr;
    }
  }

  const keyForAttributeFunction = isFunction(opts.keyForAttribute)
      ? opts.keyForAttribute
      : (attribute) => Inflector.caserize(attribute, opts);

  function keyForAttribute(attribute) {
    if (isPlainObject(attribute)) {
      return _transform(attribute, transformFunction);
    } else if (Array.isArray(attribute)) {
      return attribute.map(attributeFunction);
    } else {
      return keyForAttributeFunction(attribute);
    }
  }

  function getId() {
    return opts.id || 'id';
  }

  function getRef(current, item, opts) {
    if (isFunction(opts.ref)) {
      return opts.ref(current, item);
    } else if (opts.ref === true) {
      if (Array.isArray(item)) {
        return item.map(function (val) {
          return String(val);
        });
      } else if (item) {
        return String(item);
      }
    } else if (item && item[opts.ref]){
      return String(item[opts.ref]);
    }
  }

  function getType(str, attrVal) {
    var type;
    attrVal = attrVal || {};

    if (isFunction(opts.typeForAttribute)) {
      type = opts.typeForAttribute(str, attrVal);
    }

    // If the pluralize option is on, typeForAttribute returned undefined or wasn't used
    if ((opts.pluralizeType === undefined || opts.pluralizeType) && type === undefined) {
      type = Inflector.pluralize(str);
    }

    if (type === undefined) {
      type = str;
    }

    return type;
  }

  function getLinks(current, links, dest) {
    return _mapValues(links, function (value) {
      if (isFunction(value)) {
        return value(record, current, dest);
      } else {
        return value;
      }
    });
  }

  function getMeta(current, meta) {
    if (isFunction(meta)) {
        return meta(record);
    } else {
      return _mapValues(meta, function (value) {
        if (isFunction(value)) {
          return value(record, current);
        } else {
          return value;
        }
      });
    }
  }

  function pickFunction (value, key) {
    return keyForAttribute(key);
  }

  function pick(obj, attributes) {
    return _mapKeys(_pick(obj, attributes), pickFunction);
  }

  function isCompoundDocumentIncluded(setKey) {
    return includedSet.get(setKey);
  }

  function pushToIncluded(payload, item) {
    const setKey = `${item.type}-${item.id}`;
    var included = isCompoundDocumentIncluded(setKey);
    if (included) {
      // Merge relationships
      included.relationships = _merge(included.relationships,
        _pickBy(item.relationships, _identity));

      // Merge attributes
      included.attributes = _merge(included.attributes,
        _pickBy(item.attributes, _identity));
    } else {
      if (!payload.included) { payload.included = []; }
      includedSet.set(setKey, item);
      payload.included.push(item);
    }
  }

  this.serialize = function (dest, current, attribute, opts) {
    var data = null;

    if (opts && opts.ref) {
      if (!dest.relationships) { dest.relationships = {}; }

      if (Array.isArray(current[attribute])) {
        data = current[attribute].map((item) => this.serializeRef(item, current, attribute, opts));
      } else {
        data = this.serializeRef(current[attribute], current, attribute,
          opts);
      }

      dest.relationships[keyForAttribute(attribute)] = {};
      if (!opts.ignoreRelationshipData) {
        dest.relationships[keyForAttribute(attribute)].data = data;
      }

      if (opts.relationshipLinks) {
        var links = getLinks(current[attribute], opts.relationshipLinks, dest);
        if (links.related) {
          dest.relationships[keyForAttribute(attribute)].links = links;
        }
      }

      if (opts.relationshipMeta) {
        dest.relationships[keyForAttribute(attribute)].meta =
          getMeta(current[attribute], opts.relationshipMeta);
      }
    } else {
      if (Array.isArray(current[attribute])) {
        if (current[attribute].length && isPlainObject(current[attribute][0])) {
          data = current[attribute].map((item) => this.serializeNested(item, current, attribute, opts));
        } else {
          data = current[attribute];
        }

        dest.attributes[keyForAttribute(attribute)] = data;
      } else if (isPlainObject(current[attribute])) {
        data = this.serializeNested(current[attribute], current, attribute, opts);
        dest.attributes[keyForAttribute(attribute)] = data;
      } else {
        dest.attributes[keyForAttribute(attribute)] = current[attribute];
      }
    }
  };

  this.serializeRef = function (dest, current, attribute, opts) {
    var id = getRef(current, dest, opts);
    var type = getType(attribute, dest);

    var relationships = [];
    var includedAttrs = [];

    if (opts.attributes) {
      if (dest) {
        opts.attributes.forEach(function (attr) {
          if (opts[attr] && _isUndefined(dest[attr]) && opts[attr].nullIfMissing) {
            dest[attr] = null;
          }
        });
      }
      relationships = opts.attributes.filter(function (attr) {
        return opts[attr];
      });

      includedAttrs = opts.attributes.filter(function (attr) {
        return !opts[attr];
      });
    }

    var included = { type: type, id: id };
    if (includedAttrs) { included.attributes = pick(dest, includedAttrs); }

    const relationShipsFunction = (relationship) => {
      if (dest && (isComplexType(dest[relationship]) || dest[relationship] === null)) {
        this.serialize(included, dest, relationship, opts[relationship]);
      }
    }
    relationships.forEach(relationShipsFunction);

    if (includedAttrs.length &&
      (opts.included === undefined || opts.included)) {
      if (opts.includedLinks) {
        included.links = getLinks(dest, opts.includedLinks);
      }

      if (typeof id !== 'undefined') { pushToIncluded(payload, included); }
    }

    return typeof id !== 'undefined' ? { type: type, id: id } : null;
  };

  this.serializeNested = function (dest, current, attribute, opts) {
    var embeds = [];
    var attributes = [];

    var ret = {};
    if (opts && opts.attributes) {
      embeds = opts.attributes.filter(function (attr) {
        return opts[attr];
      });

      attributes = opts.attributes.filter(function (attr) {
        return !opts[attr];
      });

      if (attributes) { ret.attributes = pick(dest, attributes); }

      const embedsFunction = (embed) => {
        if (isComplexType(dest[embed])) {
          this.serialize(ret, dest, embed, opts[embed]);
        }
      }
      embeds.forEach(embedsFunction);
    } else {
      ret.attributes = dest;
    }

    return ret.attributes;
  };

  this.perform = function () {
    if( record === null ){
        return null;
    }

    // If option is present, transform record
    if (opts && opts.transform) {
      record = opts.transform(record);
    }

    // Top-level data.
    var data = { type: getType(collectionName, record) };
    if (!_isNil(record[getId()])) { data.id = String(record[getId()]); }

    // Data links.
    if (opts.dataLinks) {
      data.links = getLinks(record, opts.dataLinks);
    }

    // Data meta
    if (opts.dataMeta) {
      data.meta = getMeta(record, opts.dataMeta);
    }

    _each(opts.attributes, (attribute) => {
      var splittedAttributes = attribute.split(':');

      if (opts[attribute] && _isUndefined(record[attribute]) && opts[attribute].nullIfMissing) {
        record[attribute] = null;
      }

      if (splittedAttributes[0] in record) {
        if (!data.attributes) { data.attributes = {}; }

        var attributeMap = attribute;
        if (splittedAttributes.length > 1) {
          attribute = splittedAttributes[0];
          attributeMap = splittedAttributes[1];
        }

        this.serialize(data, record, attribute, opts[attributeMap]);
      }
    });

    return data;
  };
};
