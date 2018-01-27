# JSON API Serializer

<p align="center">
  <img src="https://github.com/SeyZ/jsonapi-serializer/blob/master/logo.jpg?raw=true" alt="JSONAPI Serializer Logo">
</p>

[![Build Status](https://travis-ci.org/SeyZ/jsonapi-serializer.svg?branch=master)](https://travis-ci.org/SeyZ/jsonapi-serializer)
[![npm version](https://img.shields.io/npm/v/jsonapi-serializer.svg)](https://yarnpkg.com/en/package/jsonapi-serializer)
[![download](https://img.shields.io/npm/dm/jsonapi-serializer.svg)](https://yarnpkg.com/en/package/jsonapi-serializer)

A Node.js framework agnostic library for (de)serializing your data to [JSON
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


#### Available serialization option (`opts` argument)

- **attributes**: An array of attributes to show. You can define an attribute as an option if you want to define some relationships (included or not).
    - **ref**: If present, it's considered as a relationships.
    - **included**: Consider the relationships as [compound document](http://jsonapi.org/format/#document-compound-documents). Default: true.
    - **id**: Configurable identifier field for the resource. Default: `id`.
    - **attributes**: An array of attributes to show.
    - **topLevelLinks**: An object that describes the top-level links. Values can be *string* or a *function*
    - **dataLinks**: An object that describes the links inside data. Values can be *string* or a *function* (see examples below)
    - **dataMeta**: An object that describes the meta inside data. Values can be a plain value or a *function* (see examples below)
    - **relationshipLinks**: An object that describes the links inside relationships. Values can be *string* or a *function*
    - **relationshipMeta**: An object that describes the meta inside relationships. Values can be a plain value or a *function*
    - **ignoreRelationshipData**: Do not include the `data` key inside the relationship. Default: false.
    - **keyForAttribute**: A function or string to customize attributes. Functions are passed the attribute as a single argument and expect a string to be returned. Strings are aliases for inbuilt functions for common case conversions. Options include: `dash-case` (default), `lisp-case`, `spinal-case`, `kebab-case`, `underscore_case`, `snake_case`, `camelCase`, `CamelCase`.
    - **nullIfMissing**: Set the attribute to null if missing from your data input. Default: false.
    - **pluralizeType**: A boolean to indicate if the type must be pluralized or not. Default: true.
    - **typeForAttribute**: A function that maps the attribute (passed as an argument) to the type you want to override. If it returns `undefined`, ignores the flag for that attribute. Option *pluralizeType* ignored if set.
    - **meta**: An object to include non-standard meta-information. Values can be a plain value or a *function*
    - **transform**: A function to transform each record before the serialization.

**Examples**

- [Express example](https://github.com/SeyZ/jsonapi-serializer/tree/master/examples/express)
- [Simple usage](#simple-usage-serializer)
- [More examples in tests](https://github.com/SeyZ/jsonapi-serializer/blob/master/test/serializer.js)

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

#### Available deserialization option (`opts` argument)

- **keyForAttribute**: A function or string to customize attributes. Functions are passed the attribute as a single argument and expect a string to be returned. Strings are aliases for inbuilt functions for common case conversions. Options include: `dash-case` (default), `lisp-case`, `spinal-case`, `kebab-case`, `underscore_case`, `snake_case`, `camelCase`, `CamelCase`.
- **AN\_ATTRIBUTE\_TYPE**: this option name corresponds to the type of a relationship from your JSONAPI document.
	- **valueForRelationship**: A function that returns whatever you want for a relationship (see examples below) ***can return a Promise (see tests)***
   - **transform**: A function to transform each record after the deserialization.

**Examples**

- [Simple usage](#simple-usage-deserializer)
- [Relationship](#relationship-deserializer)
- [More examples in tests](https://github.com/SeyZ/jsonapi-serializer/blob/master/test/deserializer.js)

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

#### Notes on Promises
The deserialization option `valueForRelationship` supports returning a `Promise` and so this library uses `Promises` under the hood. `bluebird` was previously used as a dependency, but due to bundle size concerns on both node and the web it was replaced with native promises.

`bluebird` is definitely [more performant](http://bluebirdjs.com/docs/benchmarks.html) than native Promises. If performance is a major concern `Promise` can be globally polyfilled
- node - via `global.Promise = require('bluebird')`
- web - global `Promise` automatically gets assigned when using the [script tag](http://bluebirdjs.com/docs/getting-started.html) to load `bluebird`

## Error serialization

    var JSONAPIError = require('jsonapi-serializer').Error;
    var error = new JSONAPIError(opts);

The function JSONAPIError takes one argument:

- `opts`: The error options. All options are optional.

#### Available error option (`opts` argument)

- **id**: a unique identifier for this particular occurrence of the problem.
- **status**: the HTTP status code applicable to this problem, expressed as a string value.
- **code**: an application-specific error code, expressed as a string value.
- **title**: a short, human-readable summary of the problem that SHOULD NOT change from occurrence to occurrence of the problem, except for purposes of localization.
- **detail**: a human-readable explanation specific to this occurrence of the problem. Like title, this field’s value can be localized.
- **source**: an object containing references to the source of the error, optionally including any of the following members:
  - **pointer**: a JSON Pointer [RFC6901] to the associated entity in the request document [e.g. "/data" for a primary data object, or "/data/attributes/title" for a specific attribute].
  - **parameter**: a string indicating which URI query parameter caused the error.
- **links**: a links object containing the following members:
  - **about**: a link that leads to further details about this particular occurrence of the problem.
- **meta**: a meta object containing non-standard meta-information about the error.

**Examples**

- [Simple usage](#simple-usage-error)
- [More example](https://github.com/SeyZ/jsonapi-serializer/blob/master/test/error.js)

<a name="simple-usage-error"></a>
Simple usage:

```javascript
var JSONAPIError = require('jsonapi-serializer').Error;

var errors = new JSONAPIError({
  code: '123',
  source: { 'pointer': '/data/attributes/first-name' },
  title: 'Value is too short',
  detail: 'First name must contain at least three characters.'
});

// `errors` here are JSON API compliant.
```

The result will be something like:

```javascript
{
  "errors": [
    {
      "code":   "123",
      "source": { "pointer": "/data/attributes/first-name" },
      "title":  "Value is too short",
      "detail": "First name must contain at least three characters."
    }
  ]
}
```

# License

[MIT](https://github.com/SeyZ/jsonapi-serializer/blob/master/LICENSE)
