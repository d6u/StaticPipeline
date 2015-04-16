'use strict';

import { expect } from 'chai';
import sinon from 'sinon';
import Bluebird from 'bluebird';
import path from 'path';
import Task, { mkdir, writeFile, parseGitHash } from '../lib/task';
import * as Promisified from '../lib/promisified';

describe('parseGitHash', function () {

  it('should resolve hash object', function (done) {
    parseGitHash('package.json')
      .then(function (obj) {
        expect(obj).ownProperty('timestamp');
        expect(obj).ownProperty('hash');
      })
      .then(done, done);
  });

  it('should throw error', function (done) {
    parseGitHash('not_exist_file.txt')
      .catch(function (err) {
        expect(err).instanceof(Error);
      })
      .then(done, done);
  });

});

describe('Task', function () {
  describe('resolveSrcDest', function () {

    var sandbox = sinon.sandbox.create();
    var globStub;

    afterEach(function () {
      sandbox.restore();
      globStub = null;
    });

    it('should resolve with [{}] if config.files is not defiend', function (done) {
      var task = new Task({});

      task.resolveSrcDest()
        .then((pairs) => {
          expect(pairs).eql([{}]);
          expect(task.srcDestPairs).eql([]);
        })
        .then(done, done);
    });

    it('should resolve with one src-dest pair', function (done) {

      globStub = sandbox.stub(Promisified, 'glob', function () {
        return Bluebird.resolve(['globed/path']);
      });

      var task = new Task({
        files: [{
          src: 'input/path',
          dest: 'output/path'
        }]
      });

      task.resolveSrcDest()
        .then((pairs) => {
          expect(pairs).eql([{
            dest: path.resolve('output/path'),
            src: 'globed/path'
          }]);
          expect(task.srcDestPairs).equal(pairs);
          expect(globStub.callCount).equal(1);
          expect(globStub.getCall(0).args).eql([path.resolve('input/path')]);
        })
        .then(done, done);
    });

    it('should replace `base` with `dest` if `base` is defined', function (done) {

      globStub = sandbox.stub(Promisified, 'glob', function () {
        return Bluebird.resolve([
          path.resolve('source/file1.js'),
          path.resolve('source/file2.js')
        ]);
      });

      var task = new Task({
        files: [{
          base: 'source',
          src: '*.js',
          dest: 'public'
        }]
      });

      task.resolveSrcDest()
        .then((pairs) => {
          expect(pairs).eql([
            {
              dest: path.resolve('public/file1.js'),
              src:  path.resolve('source/file1.js')
            },
            {
              dest: path.resolve('public/file2.js'),
              src:  path.resolve('source/file2.js')
            }
          ]);
          expect(task.srcDestPairs).equal(pairs);
          expect(globStub.callCount).equal(1);
          expect(globStub.getCall(0).args).eql([path.resolve('source/*.js')]);
        })
        .then(done, done);
    });

    it('should replace file extension with `ext` if `base` is defined', function (done) {

      globStub = sandbox.stub(Promisified, 'glob', function () {
        return Bluebird.resolve([
          path.resolve('source/file1.coffee'),
          path.resolve('source/file2.coffee')
        ]);
      });

      var task = new Task({
        files: [{
          base: 'source',
          src: '*.coffee',
          dest: 'public',
          ext: 'js'
        }]
      });

      task.resolveSrcDest()
        .then((pairs) => {
          expect(pairs).eql([
            {
              src:  path.resolve('source/file1.coffee'),
              dest: path.resolve('public/file1.js')
            },
            {
              src:  path.resolve('source/file2.coffee'),
              dest: path.resolve('public/file2.js')
            }
          ]);
          expect(task.srcDestPairs).equal(pairs);
          expect(globStub.callCount).equal(1);
          expect(globStub.getCall(0).args).eql([path.resolve('source/*.coffee')]);
        })
        .then(done, done);
    });

  });
});
