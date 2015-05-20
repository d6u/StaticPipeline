#!/usr/bin/env node

var yargs = require('yargs');
var argv = yargs
  .boolean('silent')
  .boolean('disable-hashing')
  .boolean('watch')
  .boolean('help')
  .alias('w', 'watch')
  .alias('h', 'help')
  .argv;

if (argv.help) {
  console.log("\n\
  Usage: static-pipeline [options] task\n\
\n\
  Options:\n\
    -h, --help         Show this\n\
    -w, --watch        Run task on file changes\n\
    --disable-hashing  Hashing functions will do nothing\n\
    --silent           No log output\n\
\n");

  process.exit(0);
}

var path = require('path');
var assign = require('lodash/object/assign');
var StaticPipeline = require('../dist');

var config = {};

require(path.resolve('Staticfile'))(config);

// Config options will be overwrite by command line args
var options = assign(
  {
    logging: true
  },
  config.options,
  {
    disableHash: argv['disable-hashing'],
    logging: !argv.silent,
    watching: argv.watch
  });

new StaticPipeline(config.tasks, options).start(argv._[0]);
