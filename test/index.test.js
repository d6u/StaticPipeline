'use strict';

import { expect } from 'chai';
import sinon from 'sinon';
import StaticPipeline, { resolveTaskDependencies } from '../lib/index';
import {
  TaskNotFoundError,
  CircularDependencyError
} from '../lib/errors';

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

describe('StaticPipeline', () => {
  describe('config()', () => {

    // let sandbox = sinon.sandbox.create();

    it('should configure instance', () => {
      var staticPipeline = new StaticPipeline();
      expect(staticPipeline.tasks).equal(null);

      var a = {};
      staticPipeline.config(function (config) {
        config.tasks = a;
      });

      expect(staticPipeline.tasks).equal(a);
    });

  });
});
