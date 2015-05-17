import Bluebird from 'bluebird';
import globOriginal from 'glob';
import fsOriginal from 'fs';
import { exec as execOriginal } from 'child_process';

export const glob = Bluebird.promisify(globOriginal);
export const fs   = Bluebird.promisifyAll(fsOriginal);
export const exec = Bluebird.promisify(execOriginal);
