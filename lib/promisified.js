'use strict';

import * as Bluebird from 'bluebird';
import * as globOriginal from 'glob';
import * as fsOriginal from 'fs';
import { execOriginal } from 'child_process';

export var glob = Bluebird.promisify(globOriginal);
export var fs = Bluebird.promisifyAll(fsOriginal);
export var exec = Bluebird.promisify(execOriginal);
