'use strict';

var expect = require('chai').expect;

describe('hello', function() {

  it('says hello world', function() {
    expect('hello world').equal('hello world');
  });

  it('says hello to person', function() {
    expect('hello Bob').equal('hello Bob');
  });

});
