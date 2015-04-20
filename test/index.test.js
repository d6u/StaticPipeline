'use strict';

import { expect } from 'chai';
import sinon from 'sinon';
import StaticPipeline from '../lib/index';

describe('StaticPipeline', () => {
  describe('config()', () => {

    // let sandbox = sinon.sandbox.create();

    it('should configure instance', () => {
      var staticPipeline = new StaticPipeline();
      expect(staticPipeline.tasks).eql([]);

      var a = {};
      staticPipeline.config(function (config) {
        config.tasks = a;
      });

      expect(staticPipeline.tasks).equal(a);
    });

  });
});
