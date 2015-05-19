import { expect } from 'chai';
import sinon from 'sinon';
import StaticPipeline from '../lib/index';

describe('StaticPipeline ~ _processTask()', function () {

  describe('pipeline', function () {

    const _processTask = StaticPipeline.prototype._processTask;

    it('should have desired properties', function (done) {
      _processTask.bind({
        opts: {},
        _setAsset() {
          return 'setAsset';
        },
        _makeAssetHelper() {
          return 'assets';
        }
      })({
        src: '/home/source.js',
        dest: '/home/destination.js'
      }, function (pipeline) {

        expect(pipeline.src).equal('/home/source.js');
        expect(pipeline.dest).equal('/home/destination.js');
        expect(pipeline.log).equal('randomObject');
        expect(pipeline.setAsset()).equal('setAsset');
        expect(pipeline.assets).equal('assets');
        expect(pipeline.gitHash).not.undefined;
        expect(pipeline.done).not.undefined;
        expect(pipeline.write).not.undefined;
        expect(pipeline.hash).not.undefined;

        done();
      }, {
        log: 'randomObject'
      });
    });

    describe('done()', function () {

      const sandbox = sinon.sandbox.create();

      afterEach(function () {
        sandbox.restore();
      });

      it('should not call `write`', function (done) {
        let writeStub;
        let iterator = _processTask.bind({
          opts: {},
          _setAsset() {
            return 'setAsset';
          },
          _makeAssetHelper() {
            return 'assets';
          }
        })({
          src: '/home/source.js',
          dest: '/home/destination.js'
        }, function (pipeline) {

          writeStub = sandbox.stub(pipeline, 'write');

          pipeline.done();
        }, {
          log: 'randomObject'
        });

        iterator
          .then(function () {
            expect(writeStub.callCount).equal(0);
          })
          .then(done, done);
      });

      it('should call `write` with dest as path', function (done) {
        let writeStub;
        let iterator = _processTask.bind({
          opts: {},
          _setAsset() {
            return 'setAsset';
          },
          _makeAssetHelper() {
            return 'assets';
          }
        })({
          src: '/home/source.js',
          dest: '/home/destination.js'
        }, function (pipeline) {

          writeStub = sandbox.stub(pipeline, 'write');

          pipeline.done('content');
        }, {
          log: 'randomObject'
        });

        iterator
          .then(function () {
            expect(writeStub.callCount).equal(1);
            expect(writeStub.getCall(0).args).eql(['/home/destination.js', 'content']);
          })
          .then(done, done);
      });

      it('should call `write`', function (done) {
        let writeStub;
        let iterator = _processTask.bind({
          opts: {},
          _setAsset() {
            return 'setAsset';
          },
          _makeAssetHelper() {
            return 'assets';
          }
        })({
          src: '/home/source.js',
          dest: '/home/destination.js'
        }, function (pipeline) {

          writeStub = sandbox.stub(pipeline, 'write');

          pipeline.done('path', 'content');
        }, {
          log: 'randomObject'
        });

        iterator
          .then(function () {
            expect(writeStub.callCount).equal(1);
            expect(writeStub.getCall(0).args).eql(['path', 'content']);
          })
          .then(done, done);
      });

    });

    describe('hash()', function () {

      const sandbox = sinon.sandbox.create();

      afterEach(function () {
        sandbox.restore();
      });

      it('should hash string', function (done) {
        let writeStub;
        let iterator = _processTask.bind({
          opts: {},
          _setAsset() {
            return 'setAsset';
          },
          _makeAssetHelper() {
            return 'assets';
          }
        })({
          src: '/home/source.js',
          dest: '/home/destination.js'
        }, function (pipeline) {

          writeStub = sandbox.stub(pipeline, 'write');

          expect(pipeline.hash('123')).eql({
            hash: '202cb962ac59075b964b07152d234b70',
            hashedDest: '/home/destination-202cb962ac59075b964b07152d234b70.js'
          });

          pipeline.done();

        }, {
          log: 'randomObject'
        });

        iterator
          .then(function () {
            expect(writeStub.callCount).equal(0);
          })
          .then(done, done);
      });

    });

  });

});
