module.exports = function(config) {

  config.tasks = {
    css: {
      files: [{
        base: 'source',
        src: '**/*.css',
        dest: 'public',
      }],
      process: function(pipeline) {
        console.log('src  -->', pipeline.src);
        console.log('dest -->', pipeline.dest);
        pipeline.done();
      }
    }
  };

};
