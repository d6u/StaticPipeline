var StaticPipeline = require('../../lib');

var roll = new StaticPipeline({
  task1: {
    files: [
      {
        base: 'lib',
        src: '**/*.js',
        dest: 'dist'
      }
    ],
    process: function (pipeline) {
      console.log(`==> ${pipeline.src}`);
      pipeline.watch();
      pipeline.done();
    }
  }
}, {
  logging: true
});

roll.start();
