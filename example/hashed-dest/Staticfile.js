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
            var dest = pipeline.hash(results.css).hashedDest;
            pipeline.done(dest, results.css);
          }
        });
      }
    }
  };

};
