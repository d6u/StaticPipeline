var sass = require('node-sass');

module.exports = function(config) {

  config.tasks = {
    scss: {
      files: [{
        src: 'app.scss',
        dest: 'app.css',
      }],
      process: function(pipeline) {
        sass.render({
          file: pipeline.src,
          success: function(results) {
            console.log(pipeline.hash(results.css));
            pipeline.write(pipeline.dest, results.css);
            pipeline.done();
          }
        });
      }
    }
  };

};
