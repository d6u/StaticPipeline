'use strict';

import Bluebird from 'bluebird';
import globOriginal from 'glob';
import fsOriginal from 'fs';
import { exec as execOriginal } from 'child_process';

export var glob = Bluebird.promisify(globOriginal);
export var fs   = Bluebird.promisifyAll(fsOriginal);
export var exec = Bluebird.promisify(execOriginal);
