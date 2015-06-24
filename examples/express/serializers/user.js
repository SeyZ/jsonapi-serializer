'use strict';
var JSONAPISerializer = require('jsonapi-serializer');

function UserSerializer(user) {

  this.serialize = function () {
    return new JSONAPISerializer('users', user, {
      attributes: ['firstName', 'lastName'],
    });
  };

}

module.exports = UserSerializer;
