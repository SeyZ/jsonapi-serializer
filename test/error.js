'use strict';
/* global describe, it */

var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;

var http = require('http');

var JSONAPIError = require('../lib/error/JSONAPIError');
var NotFound = require('../lib/error/NotFound');

describe('Errors', function () {

  describe('Status', function () {
    it('should set HTTP status code 500 by implicit default', function (done) {
      var error = new JSONAPIError();

      assert(error.status === '500', 'Wrong HTTP status code');

      done(null, error);
    });

    it('should set HTTP status code 500 by explicit default', function (done) {
      var error = new JSONAPIError({
        'id': 'id',
      });

      assert(error.status === '500', 'Wrong HTTP status code');

      done(null, error);
    });

    it('should set implicit HTTP status code', function (done) {
      var error = new JSONAPIError(415);

      assert(error.status === '415', 'Wrong HTTP status code');

      done(null, error);
    });

    it('should set HTTP status title from status code', function (done) {
      var error = new JSONAPIError({
        status: 404
      });

      assert(error.title === http.STATUS_CODES[404], 'Wrong HTTP status code');

      done(null, error);
    });

    it('should set HTTP status title', function (done) {
      var error = NotFound('detail', 'code', 'id');

      assert(error.title === http.STATUS_CODES[404], 'Wrong HTTP status title');

      done(null, error);
    });
  });

  describe('Title', function () {
    it('SHOULD NOT change from occurrence to occurrence ', function (done) {
      var error1 = NotFound('detail1', 'code1', 'id1');
      var error2 = NotFound('detail2', 'code2', 'id2');

      assert(error1.title === error2.title, 'Titles are different');

      done(null, error1);
    });
  });

  describe('JSON API compliant "errors" object', function () {
    it('should handled undefined keys properly', function (done) {
      var error = NotFound();

      var result = {
        status: '404',
        title: http.STATUS_CODES[404],
      };

      expect(error).to.be.eql(result);

      done(null, error);
    });

    it('should handled empty keys properly', function (done) {
      var error = NotFound('', '', '', {});

      var result = {
        status: '404',
        title: http.STATUS_CODES[404],
      };

      expect(error).to.be.eql(result);

      done(null, error);
    });

    it('should set string keys properly', function (done) {
      var error = NotFound('detail', 'code', 'id');

      var result = {
        id: 'id',
        status: '404',
        code: 'code',
        title: http.STATUS_CODES[404],
        detail: 'detail',
      };

      expect(error).to.be.eql(result);

      done(null, error);
    });

    it('should set "meta" properly', function (done) {
      var error = NotFound('detail', '', '', { foo: 'bar' });

      var result = {
        status: '404',
        title: http.STATUS_CODES[404],
        detail: 'detail',
        meta: {
          foo: 'bar',
        }
      };

      expect(error).to.be.eql(result);

      done(null, error);
    });

    it('should set "source" properly', function (done) {
      var error = NotFound('', 'code', '', {}, '/data/pointer', 'param');

      var result = {
        status: '404',
        code: 'code',
        title: http.STATUS_CODES[404],
        source: {
          pointer: '/data/pointer',
          parameter: 'param'
        }
      };

      expect(error).to.be.eql(result);

      done(null, error);
    });

    it('should set "links" properly', function (done) {
      var error = NotFound('', 'code', '', {}, '', '', '//foo.bar/errors/baz');

      var result = {
        status: '404',
        code: 'code',
        title: http.STATUS_CODES[404],
        links: {
          about: '//foo.bar/errors/baz',
        }
      };

      expect(error).to.be.eql(result);

      done(null, error);
    });
  });

});
