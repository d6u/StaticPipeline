var sass = require('node-sass');
var jade = require('jade');

module.exports = function(config) {

  config.options = {
    assets: {
      publicDir: 'public'
    }
  };

  config.tasks = {
    scss: {
      files: [{
        src: 'source/app.scss',
        dest: 'public/app.css',
      }],
      process: function(pipeline) {
        sass.render({
          file: pipeline.src,
          success: function(results) {
            var hashedDest = pipeline.hash(results.css).hashedDest;
            pipeline.setAsset(pipeline.dest, hashedDest);
            pipeline.done(hashedDest, results.css);
          }
        });
      }
    },
    jade: {
      depends: ['scss'],
      files: [{
        src: 'source/index.jade',
        dest: 'public/index.html'
      }],
      process: function(pipeline) {
        var html = jade.renderFile(pipeline.src, {
          assets: pipeline.assets
        });
        pipeline.done(html);
      }
    }
  };

};
