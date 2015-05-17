import { expect } from 'chai';
import { resolveTaskDependencies } from '../lib/util';
import { TaskNotFoundError, CircularDependencyError } from '../lib/errors';

describe('resolveTaskDependencies()', () => {

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

  it('should resolve only for target task', () => {
    expect(resolveTaskDependencies({
      scss: {},
      autoprefixer: {
        depends: ['scss']
      },
      uglify: {
        depends: ['autoprefixer', 'scss']
      }
    }, 'autoprefixer')).eql(['scss', 'autoprefixer']);
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

