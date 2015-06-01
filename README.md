# JSON API Serializer
[![Build Status](https://travis-ci.org/SeyZ/jsonapi-serializer.svg?branch=master)](https://travis-ci.org/SeyZ/jsonapi-serializer)

A Node.js framework agnostic library for serializing your data to [JSON
API](http://jsonapi.org) (1.0 compliant).

## Installation
`$ npm install jsonapi-serializer`

## Usage
Here's an example of serializing a User resource to JSON API.
```
  var JSONAPISerializer = require('jsonapi-serializer');

  new JSONAPISerializer('users', data, {
    apiEndpoint: 'http://localhost:3000/api',
    attributes: ['firstName', 'lastName', 'address', 'books'],
    address: {
      ref: '_id',
      attributes: ['addressLine1', 'addressLine2', 'zipCode', 'country']
    },
    books: {
      ref: '_id',
      attributes: ['title', 'ISBN']
    }
  }).then(function (users) {
    // `users` here is JSON API compliant.
  });
```

# License

[MIT](https://github.com/SeyZ/jsonapi-serializer/blob/master/LICENSE)
