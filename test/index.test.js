import { expect } from 'chai';
import StaticPipeline from '../lib/index';

describe('StaticPipeline', () => {

  describe('_configTasks()', () => {

    it('should configure instance', () => {
      var staticPipeline = {
        tasks: []
      };

      var a = {};

      StaticPipeline.prototype._configTasks.call(staticPipeline, function (config) {
        config.tasks = a;
      });

      expect(staticPipeline.tasks).equal(a);
    });

  });

});
