'use strict';

import { expect } from 'chai';
import sinon from 'sinon';
import Bluebird from 'bluebird';
import path from 'path';
import Task from '../lib/task';
import * as Promisified from '../lib/promisified';
import * as Util from '../lib/util';

describe('parseGitHash', function () {

  it('should resolve hash object', function (done) {
    Util.parseGitHash('package.json')
      .then(function (obj) {
        expect(obj).ownProperty('timestamp');
        expect(obj).ownProperty('hash');
      })
      .then(done, done);
  });

  it('should throw error', function (done) {
    Util.parseGitHash('not_exist_file.txt')
      .catch(function (err) {
        expect(err).instanceof(Error);
      })
      .then(done, done);
  });

});

describe('Task', function () {

  var sandbox = sinon.sandbox.create();
  var globStub;

  afterEach(function () {
    sandbox.restore();
    globStub = null;
  });

  describe('resolveSrcDest()', function () {

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

  describe('runProcess()', function () {

    it('should assign `src` and `dest`', function (done) {
      var processSpy = sandbox.spy(function (pipeline) {
        pipeline.done();
      });

      var task = new Task({process: processSpy});

      task.runProcess({src: 'input/path', dest: 'output/path'})
        .then(function () {
          expect(processSpy.callCount).equal(1);
          let args = processSpy.getCall(0).args;
          expect(args[0].src).equal('input/path');
          expect(args[0].dest).equal('output/path');
        })
        .then(done, done);
    });

    describe('pipeline.done()', function () {

      it('should not call `writeFile`', function (done) {
        var writeFileStub = sandbox.stub(Util, 'writeFile');
        var processSpy = sandbox.spy(function (pipeline) {
          pipeline.done();
        });

        var task = new Task({process: processSpy});

        task.runProcess({src: 'input/path', dest: 'output/path'})
          .then(function () {
            expect(processSpy.callCount).equal(1);
            let pipeline = processSpy.getCall(0).args[0];
            expect(pipeline.src).equal('input/path');
            expect(pipeline.dest).equal('output/path');
            expect(writeFileStub.callCount).equal(0);
          })
          .then(done, done);
      });

      it('should call `writeFile` with `dest` as path', function (done) {
        var writeFileStub = sandbox.stub(Util, 'writeFile');
        var processSpy = sandbox.spy(function (pipeline) {
          pipeline.done('content');
        });

        var task = new Task({process: processSpy});

        task.runProcess({src: 'input/path', dest: 'output/path'})
          .then(function () {
            expect(processSpy.callCount).equal(1);
            let pipeline = processSpy.getCall(0).args[0];
            expect(pipeline.src).equal('input/path');
            expect(pipeline.dest).equal('output/path');
            expect(writeFileStub.callCount).equal(1);
            var writeFileArgs = writeFileStub.getCall(0).args;
            expect(writeFileArgs[0]).equal('output/path');
            expect(writeFileArgs[1]).equal('content');
          })
          .then(done, done);
      });

      it('should call `writeFile` normally', function (done) {
        var writeFileStub = sandbox.stub(Util, 'writeFile');
        var processSpy = sandbox.spy(function (pipeline) {
          pipeline.done('path', 'content');
        });

        var task = new Task({process: processSpy});

        task.runProcess({src: 'input/path', dest: 'output/path'})
          .then(function () {
            expect(processSpy.callCount).equal(1);
            let pipeline = processSpy.getCall(0).args[0];
            expect(pipeline.src).equal('input/path');
            expect(pipeline.dest).equal('output/path');
            expect(writeFileStub.callCount).equal(1);
            var writeFileArgs = writeFileStub.getCall(0).args;
            expect(writeFileArgs[0]).equal('path');
            expect(writeFileArgs[1]).equal('content');
          })
          .then(done, done);
      });

    });

    describe('pipeline.write()', function () {

      it('should be the same instance as `writeFile`', function (done) {
        var processSpy = sandbox.spy(function (pipeline) {
          pipeline.done();
        });

        var task = new Task({process: processSpy});

        task.runProcess({src: 'input/path', dest: 'output/path'})
          .then(function () {
            expect(processSpy.callCount).equal(1);
            let pipeline = processSpy.getCall(0).args[0];
            expect(pipeline.src).equal('input/path');
            expect(pipeline.dest).equal('output/path');
            expect(pipeline.write).equal(Util.writeFile);
          })
          .then(done, done);
      });

    });

    describe('pipeline.hash()', function () {

      it('should hash string', function (done) {
        var processSpy = sandbox.spy(function (pipeline) {
          pipeline.done();
        });

        var task = new Task({process: processSpy});

        task.runProcess({src: 'input/path', dest: 'output/path'})
          .then(function () {
            expect(processSpy.callCount).equal(1);
            let pipeline = processSpy.getCall(0).args[0];
            expect(pipeline.src).equal('input/path');
            expect(pipeline.dest).equal('output/path');
            expect(pipeline.hash('123')).equal('202cb962ac59075b964b07152d234b70');
          })
          .then(done, done);
      });

    });

    describe('pipeline.gitHash()', function () {

      var execStub;

      it('should exec git command', function (done) {
        var processSpy = sandbox.spy(function (pipeline) {
          pipeline.done();
        });

        execStub = sandbox.stub(Promisified, 'exec', function () {
          return Bluebird.resolve(['123-abc']);
        });

        var task = new Task({process: processSpy});

        task.runProcess({src: 'input/path', dest: 'output/path'})
          .then(function () {
            expect(processSpy.callCount).equal(1);
            let pipeline = processSpy.getCall(0).args[0];
            expect(pipeline.src).equal('input/path');
            expect(pipeline.dest).equal('output/path');
            return pipeline.gitHash('filename')
              .then(function (h) {
                expect(h).eql({timestamp: '123', hash: 'abc'});
                expect(execStub.callCount).equal(1);
                expect(execStub.getCall(0).args).eql([
                  'git log --pretty="format:%ct-%H" -n 1 -- filename'
                ]);
              });
          })
          .then(done, done);
      });

    });
  });
});
