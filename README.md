# JSON API Serializer
[![Build Status](https://travis-ci.org/SeyZ/jsonapi-serializer.svg?branch=master)](https://travis-ci.org/SeyZ/jsonapi-serializer)

A Node.js framework agnostic library for serializing your data to [JSON
API](http://jsonapi.org) (1.0 compliant).

- [Migrate from 2.0 to 3.0](https://github.com/SeyZ/jsonapi-serializer/wiki/Migrate-from-2.0-to-3.0)
- [Migrate from 1.x to 2.0](https://github.com/SeyZ/jsonapi-serializer/wiki/Migrate-from-1.x-to-2.0)

## Installation
`$ npm install jsonapi-serializer`

## Documentation

### Serialization

    var JSONAPISerializer = require('jsonapi-serializer').Serializer;
    new JSONAPISerializer(type, opts).serialize(data);

The function `JSONAPISerializer` takes two arguments:

- `type`: The resource type.
- `opts`: The serialization options.

Calling the `serialize` method on the returned object will serialize your `data` (object or array) to a compliant JSONAPI document.


**Available serialization option (`opts` argument)**

- *attributes*: An array of attributes to show. You can define an attribute as an option if you want to define some relationships (included or not).
    - *ref*: If present, it's considered as a relationships.
    - *included*: Consider the relationships as [compound document](http://jsonapi.org/format/#document-compound-documents). Default: true.
    - *attributes*: An array of attributes to show.
    - *topLevelLinks*: An object that describes the top-level links. Values can be *string* or a *function* (see examples below)
    - *dataLinks*: An object that describes the links inside data. Values can be *string* or a *function* (see examples below)
    - *relationshipLinks*: An object that describes the links inside relationships. Values can be *string* or a *function* (see examples below)
    - *relationshipMeta*: An object that describes the meta inside relationships. Values can be *string* or a *function* (see examples below)
    - *ignoreRelationshipData*: Do not include the `data` key inside the relationship. Default: false.
    - *keyForAttribute*: A function or string to customize attributes. Functions are passed the attribute as a single argument and expect a string to be returned. Strings are aliases for inbuilt functions for common case conversions. Options include: `dash-case` (default), `lisp-case`, `spinal-case`, `kebab-case`, `underscore_case`, `snake_case`, `camelCase`, `CamelCase`.
    - *nullIfMissing*: Set the attribute to null if missing from your data input. Default: false.
    - *pluralizeType*: A boolean to indicate if the type must be pluralized or not. Default: true.
    - *typeForAttribute*: A function that maps the attribute (passed as an argument) to the type you want to override. If it returns `undefined`, ignores the flag for that attribute. Option *pluralizeType* ignored if set.
    - *meta*: An object to include non-standard meta-information.

**Examples**

- [Express example](https://github.com/SeyZ/jsonapi-serializer/tree/master/examples/express)
- [Simple usage](#simple-usage-serializer)
- [More example](https://github.com/SeyZ/jsonapi-serializer/blob/master/test/serializer.js)

<a name="simple-usage-serializer"></a>
Simple usage:

```javascript
var data = [
  { id: 1, firstName: 'Sandro', lastName: 'Munda' },
  { id: 2, firstName: 'John', lastName: 'Doe' }
];
```

```javascript
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

var UserSerializer = new JSONAPISerializer('users', {
  attributes: ['firstName', 'lastName']
});

var users = UserSerializer.serialize(data);

// `users` here are JSON API compliant.
```

The result will be something like:

```javascript
{
  "data": [{
    "type": "users",
    "id": "1",
    "attributes": {
      "first-name": "Sandro",
      "last-name": "Munda"
    }
  }, {
    "type": "users",
    "id": "2",
    "attributes": {
      "first-name": "John",
      "last-name": "Doe"
    }
  }]
}
```

### Deserialization

    var JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;
    new JSONAPIDeserializer(opts).deserialize(data);

The function `JSONAPIDeserializer` takes one argument:

- `opts`: The deserializer options.

Calling the `deserialize` method on the returned object will deserialize your `data` (JSONAPI document) to a plain javascript object.

**Available deserialization option (`opts` argument)**

- *keyForAttribute*: A function or string to customize attributes. Functions are passed the attribute as a single argument and expect a string to be returned. Strings are aliases for inbuilt functions for common case conversions. Options include: `dash-case` (default), `lisp-case`, `spinal-case`, `kebab-case`, `underscore_case`, `snake_case`, `camelCase`, `CamelCase`.
- AN\_ATTRIBUTE\_TYPE: this option name corresponds to the type of a relationship from your JSONAPI document.
	- *valueForRelationship*: A function that returns whatever you want for a relationship (see examples below)


**Examples**

- [Simple usage](#simple-usage-deserializer)
- [Relationship](#relationship-deserializer)
- [More example](https://github.com/SeyZ/jsonapi-serializer/blob/master/test/deserializer.js)

<a name="simple-usage-deserializer"></a>
Simple usage:

```
{
  data: [{
    type: 'users',
    id: '1',
    attributes: {
      'first-name': Sandro,
      'last-name': Munda
    }
  }, {
    type: 'users',
    id: '2',
    attributes: {
      'first-name': 'John',
      'last-name': 'Doe'
    }
  }]
}
```

```javascript
var JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;

new JSONAPIDeserializer().deserialize(jsonapi, function (err, users) {
  // `users` is...
});
```

```javascript
[
  { id: 1, firstName: 'Sandro', lastName: 'Munda' },
  { id: 2, firstName: 'John', lastName: 'Doe' }
];
```
<a name="relationship-deserializer"></a>
Relationship:

```
{
  data: [{
    type: 'users',
    id: '54735750e16638ba1eee59cb',
    attributes: {
      'first-name': 'Sandro',
      'last-name': 'Munda'
    },
    relationships: {
      address: {
        data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
      }
    }
  }, {
    type: 'users',
    id: '5490143e69e49d0c8f9fc6bc',
    attributes: {
      'first-name': 'Lawrence',
      'last-name': 'Bennett'
    },
    relationships: {
      address: {
        data: { type: 'addresses', id: '54735697e16624ba1eee36bf' }
      }
    }
  }]
}
```

```javascript
var JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;

new JSONAPIDeserializer({
  addresses: {
    valueForRelationship: function (relationship) {
      return {
        id: relationship.id,
        'address-line1': '406 Madison Court',
        'zip-code': '49426',
        country: 'USA'
      };
    }
  }
}).deserialize(jsonapi, function (err, users) {
  // `users` is...
});
```

```
[{
  id: '54735750e16638ba1eee59cb',
  'first-name': 'Sandro',
  'last-name': 'Munda',
  address: {
    id: '54735722e16620ba1eee36af',
    'address-line1': '406 Madison Court',
    'zip-code': '49426',
    country: 'USA'
  }
}, {
  id: '5490143e69e49d0c8f9fc6bc',
  'first-name': 'Lawrence',
  'last-name': 'Bennett',
  address: {
    id: '54735697e16624ba1eee36bf',
    'address-line1': '406 Madison Court',
    'zip-code': '49426',
    country: 'USA'
  }
}]
```

# License

[MIT](https://github.com/SeyZ/jsonapi-serializer/blob/master/LICENSE)
