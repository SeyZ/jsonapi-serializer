# JSON API Serializer
[![Build Status](https://travis-ci.org/SeyZ/jsonapi-serializer.svg?branch=master)](https://travis-ci.org/SeyZ/jsonapi-serializer)

A Node.js framework agnostic library for serializing your data to [JSON
API](http://jsonapi.org) (1.0 compliant).

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
    - *pluralizeType*: A boolean to indicate if the type must be pluralized or not. Default: true.
    - *typeForAttribute*: A function that maps the attribute (passed as an argument) to the type you want to override. Option *pluralizeType* ignored if set.
    - *meta*: An object to include non-standard meta-information.

**Examples**

- [Express example](https://github.com/SeyZ/jsonapi-serializer/tree/master/examples/express)
- [Simple usage](#simple-usage)
- [More example](https://github.com/SeyZ/jsonapi-serializer/blob/master/test/serializer.js)

<a name="simple-usage"></a>
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
  topLevelLinks: { self: 'http://localhost:3000/api/users' },
  dataLinks: {
    self: function (user) {
      return 'http://localhost:3000/api/users/' + user.id
    }
  },
  attributes: ['firstName', 'lastName']
});

var users = UserSerializer.serialize(data);

// `users` here are JSON API compliant.
```

The result will be something like:

```javascript
{
  "links": {
    "self": "http://localhost:3000/api/users"
  },
  "data": [{
    "type": "users",
    "id": "1",
    "attributes": {
      "first-name": "Sandro",
      "last-name": "Munda"
    },
    "links": "http://localhost:3000/api/users/1"
  }, {
    "type": "users",
    "id": "2",
    "attributes": {
      "first-name": "John",
      "last-name": "Doe"
    },
    "links": "http://localhost:3000/api/users/2"
  }]
}
```

# License

[MIT](https://github.com/SeyZ/jsonapi-serializer/blob/master/LICENSE)
