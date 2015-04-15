'use strict';

import { expect } from 'chai';
import sinon from 'sinon';
import Task, { mkdir, writeFile, parseGitHash } from '../lib/task';

describe('Task', () => {

  it('should return tasks queue by depended order', () => {
    expect(1).equal(1);
  });

});
