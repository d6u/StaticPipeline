'use strict';

import { expect } from 'chai';
import { parseGitHash, resolveTaskDependencies } from '../lib/util';
import {
  TaskNotFoundError,
  CircularDependencyError
} from '../lib/errors';

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

describe('resolveTaskDependencies', () => {

  it('should return tasks queue by depended order', () => {
    expect(resolveTaskDependencies({
      scss: {},
      autoprefixer: {
        depends: ['scss']
      },
      uglify: {
        depends: ['autoprefixer', 'scss']
      }
    })).eql(['scss', 'autoprefixer', 'uglify']);
  });

  it('should throw TaskNotFoundError', done => {
    try {
      resolveTaskDependencies({
        scss: {},
        autoprefixer: {
          depends: ['sass']
        }
      });
    } catch (err) {
      expect(err).instanceof(TaskNotFoundError);
      done();
    }
  });

  it('should throw CircularDependencyError', done => {
    try {
      resolveTaskDependencies({
        scss: {
          depends: ['uglify']
        },
        autoprefixer: {
          depends: ['scss']
        },
        uglify: {
          depends: ['autoprefixer']
        }
      });
    } catch (err) {
      expect(err).instanceof(CircularDependencyError);
      done();
    }
  });

});
