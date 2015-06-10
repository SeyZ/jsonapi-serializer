# JSON API Serializer
[![Build Status](https://travis-ci.org/SeyZ/jsonapi-serializer.svg?branch=master)](https://travis-ci.org/SeyZ/jsonapi-serializer)

A Node.js framework agnostic library for serializing your data to [JSON
API](http://jsonapi.org) (1.0 compliant).

## Installation
`$ npm install jsonapi-serializer`

## Documentation

**JSONAPISerializer**(type, data, opts) serializes the *data* (can be an object or an array) following the rules defined in *opts*.

**opts**:

- *apiEndpoint*: Specify the *self* attribute in the links. 
```
"links": {
  "self": "http://example.com/posts",
}
```
- *attributes*: An array of attributes to show. You can define an attribute as an option if you want to define some relationships (included or not).
  - *ref*: If present, it's considered as a [compount document](http://jsonapi.org/format/#document-compound-documents).
  - *attributes*: An array of attributes to show.


## Example

### Simple usage

```
var JSONAPISerializer = require('jsonapi-serializer');

new JSONAPISerializer('users', data, {
  apiEndpoint: 'http://localhost:3000/api/users',
  attributes: ['firstName', 'lastName']
}).then(function (users) {  
  // `users` here are JSON API compliant. 
});
```

The result will be something like:

```
{
  "links": {
    "self": "http://localhost:3000/api/users"
  },
  "data": [{
    "type": "users",
    "id": "1",
    "attributes": {
      "firstName": "Sandro",
      "lastName": "Munda"
    }
  }, {
    "type": "users",
    "id": "2",
    "attributes": {
      "firstName": "John",
      "lastName": "Doe"
    },
  }]
}
```

### Nested resource
```
var JSONAPISerializer = require('jsonapi-serializer');

new JSONAPISerializer('users', data, {
  apiEndpoint: 'http://localhost:3000/api/users',
  attributes: ['firstName', 'lastName', 'address'],
  address: {
    attributes: ['addressLine1', 'zipCode', 'city']
  }
}).then(function (users) {  
  // `users` here are JSON API compliant. 
});
```

The result will be something like:

```
{
  "links": {
    "self": "http://localhost:3000/api/users"
  },
  "data": [{
    "type": "users",
    "id": "1",
    "attributes": {
      "firstName": "Sandro",
      "lastName": "Munda",
      "address": {
        "addressLine1": "630 Central Avenue",
        "zipCode": 24012,
        "city": "Roanoke"
      }
    }
  }, {
    "type": "users",
    "id": "2",
    "attributes": {
      "firstName": "John",
      "lastName": "Doe",
      "address": {
        "addressLine1": "400 State Street",
        "zipCode": 33702,
        "city": "Saint Petersburg"
      }
    }
  }]
}
```

### Compount document

```
var JSONAPISerializer = require('jsonapi-serializer');

new JSONAPISerializer('users', data, {
  apiEndpoint: 'http://localhost:3000/api/users',
  attributes: ['firstName', 'lastName', 'books'],
  books: {
    ref: '_id',
    attributes: ['title', 'ISBN']
  }
}).then(function (users) {  
  // `users` here are JSON API compliant. 
});
```

The result will be something like:

```
{
  "links": {
    "self": "http://localhost:3000/api/users"
  },
  "data": [{
    "type": "users",
    "id": "1",
    "attributes": {
      "firstName": "Sandro",
      "lastName": "Munda"
    },
    "relationships": {
      "books": {
        "data": [
          { "type": "books", "id": "1" },
          { "type": "books", "id": "2" }
        ]
      }
    }
  }, {
    "type": "users",
    "id": "2",
    "attributes": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "relationships": {
      "books": {
        "data": [
          { "type": "books", "id": "1" },
          { "type": "books", "id": "2" }
        ]
      }
    }
  }],
  "included": [{
  	"type": "books",
  	"id": "1",
  	"attributes": {
  	  "title": "La Vida Estilista",
  	  "isbn": "9992266589"
  	}
  }, {
   "type": "books",
   "id": "2",
   "attributes": {
  	  "title": "La Maria Cebra",
  	  "isbn": "9992264446"
  	}
  }, {
   "type": "books",
   "id": "3",
   "attributes": {
  	  "title": "El Salero Cangrejo",
  	  "isbn": "9992209739"
  	}
  }]
}
```


# License

[MIT](https://github.com/SeyZ/jsonapi-serializer/blob/master/LICENSE)
