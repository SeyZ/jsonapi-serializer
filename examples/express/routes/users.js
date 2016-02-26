'use strict';
var express = require('express');
var router = express.Router();
var UserSerializer = require('../serializers/user');

router.get('/', function (req, res) {
  var users = [{
    id: 1,
    firstName: 'Sandro',
    lastName: 'Munda',
    password: 'secret'
  }, {
    id: 2,
    firstName: 'John',
    lastName: 'Doe',
    password: 'ultrasecret'
  }];

  var jsonapi = UserSerializer.serialize(users);
  res.send(jsonapi);
});

module.exports = router;
