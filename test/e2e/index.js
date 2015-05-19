/*eslint no-console:0*/

import StaticPipeline from '../../lib';

var roll = new StaticPipeline({
  task1: {
    files: [
      {
        src: 'lib/index.js',
        dest: 'distL/index.js'
      },
      {
        base: 'src',
        src: '**/*.js',
        dest: 'distS'
      }
    ],
    process: function (pipeline) {
      console.log(`==> ${pipeline.src} -> ${pipeline.dest}`);
      pipeline.watch();
      pipeline.done();
    }
  }
}, {
  logging: true,
  workingDir: __dirname
});

roll.start();
