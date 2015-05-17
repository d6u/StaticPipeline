import { expect } from 'chai';
import sinon from 'sinon';
import Bluebird from 'bluebird';
import * as GitHashFactoryModule from '../lib/git-hash-factory';
import gitHashFactory from '../lib/git-hash-factory';

const parseGitHash = GitHashFactoryModule.parseGitHash;

describe('parseGitHash()', function () {

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

describe('gitHashFactory() -> gitHash()', function () {

  const sandbox = sinon.sandbox.create();
  let parseGitHashStub;

  beforeEach(function () {
    parseGitHashStub = sandbox.stub(GitHashFactoryModule, 'parseGitHash', function () {
      return Bluebird.resolve({
        timestamp: 123456,
        hash: 'abcdef'
      });
    });
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('should not give hash', function (done) {
    let gitHash = gitHashFactory({
      disable: true,
      dest: 'abc'
    });

    gitHash(function (err, result) {
      expect(err).equal(null);
      expect(result).eql({
        hash: null,
        hashedDest: 'abc'
      });
      done();
    });
  });

  it('should get git hash from src path', function (done) {
    let gitHash = gitHashFactory({
      dest: 'destination.js',
      src: 'source'
    });

    gitHash(function (err, result) {
      expect(err).equal(null);
      expect(parseGitHashStub.callCount).equal(1);
      expect(parseGitHashStub.getCall(0).args).eql(['source']);
      expect(result).eql({
        hash: 'abcdef',
        hashedDest: 'destination-abcdef.js'
      });
      done();
    });
  });

  it('should get git hash from single path', function (done) {
    let gitHash = gitHashFactory({
      dest: 'destination.js',
      src: 'source'
    });

    gitHash('target', function (err, result) {
      expect(err).equal(null);
      expect(parseGitHashStub.callCount).equal(1);
      expect(parseGitHashStub.getCall(0).args).eql(['target']);
      expect(result).eql({
        hash: 'abcdef',
        hashedDest: 'destination-abcdef.js'
      });
      done();
    });
  });

  it('should get git hash from array of path', function (done) {
    let gitHash = gitHashFactory({
      dest: 'destination.js',
      src: 'source'
    });

    let i = 0;
    parseGitHashStub.restore();
    parseGitHashStub = sandbox.stub(GitHashFactoryModule, 'parseGitHash', function () {
      return Bluebird.resolve({
        timestamp: i,
        hash: String(i++)
      });
    });

    gitHash(['target1', 'target2', 'target3'], function (err, result) {
      expect(err).equal(null);
      expect(parseGitHashStub.callCount).equal(3);
      expect(parseGitHashStub.getCall(0).args).eql(['target1']);
      expect(parseGitHashStub.getCall(1).args).eql(['target2']);
      expect(parseGitHashStub.getCall(2).args).eql(['target3']);
      expect(result).eql({
        hash: '2',
        hashedDest: 'destination-2.js'
      });
      done();
    });
  });

});
