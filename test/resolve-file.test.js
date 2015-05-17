import { expect } from 'chai';
import sinon from 'sinon';
import Bluebird from 'bluebird';
import { FileNotFoundError } from '../lib/errors';
import * as PromisifiedModule from '../lib/promisified';
import resolveFile from '../lib/resolve-file';

describe('resolveFile()', function () {

  const sandbox = sinon.sandbox.create();

  afterEach(function () {
    sandbox.restore();
  });

  it('should resolve with a single resolve result object', function (done) {

    sandbox.stub(PromisifiedModule, 'glob', function () {
      return Bluebird.resolve(['target/source']);
    });

    resolveFile({
      src: 'target/source',
      dest: 'target/destination'
    }, {
      workingDir: '/home'
    }).then(function (pairs) {
        expect(pairs).eql([{
          src: '/home/target/source',
          dest: '/home/target/destination'
        }]);
      })
      .then(done, done);
  });

  it('should resolve with array of resolve result objects', function (done) {

    sandbox.stub(PromisifiedModule, 'glob', function () {
      return Bluebird.resolve([
        'source/a.js',
        'source/b.js',
        'source/sub/c.js'
      ]);
    });

    resolveFile({
      base: 'source',
      src: '**',
      dest: 'destination'
    }, {
      workingDir: '/home'
    }).then(function (pairs) {
        expect(pairs).eql([
          {src: '/home/source/a.js', dest: '/home/destination/a.js'},
          {src: '/home/source/b.js', dest: '/home/destination/b.js'},
          {src: '/home/source/sub/c.js', dest: '/home/destination/sub/c.js'}
        ]);
      })
      .then(done, done);
  });

  it('should replace extension for dest property', function (done) {

    sandbox.stub(PromisifiedModule, 'glob', function () {
      return Bluebird.resolve([
        'source/a.js',
        'source/b.js',
        'source/sub/c.js'
      ]);
    });

    resolveFile({
      base: 'source',
      src: '**',
      dest: 'destination',
      ext: 'es6'
    }, {
      workingDir: '/home'
    }).then(function (pairs) {
        expect(pairs).eql([
          {src: '/home/source/a.js', dest: '/home/destination/a.es6'},
          {src: '/home/source/b.js', dest: '/home/destination/b.es6'},
          {src: '/home/source/sub/c.js', dest: '/home/destination/sub/c.es6'}
        ]);
      })
      .then(done, done);
  });

  it('should throw error if no file could be found', function (done) {

    sandbox.stub(PromisifiedModule, 'glob', function () {
      return Bluebird.resolve([]);
    });

    resolveFile({
      src: 'target/source',
      dest: 'target/destination'
    }, {
      workingDir: '/home'
    }).catch(FileNotFoundError, function () {
        // Do nothing
      })
      .then(done, done);
  });

});
