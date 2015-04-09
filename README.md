# Static Pipeline

Static Pipeline is not another build system or task runner. It is a static assets processing framework and template helper. You can use whatever assets preprocessor you want.

## Why Use Static Pipeline instead of Gulp or Grunt?

- Build tools and task runners like Gulp and Grunt all depend on their plugins. Plugins prevents you from using the real power of original assets processing tools, e.g. node-sass or browserify. Why bother learning browserify plugin instead of the browserify itself?
- For static assets to bust browser cache, we often append a hash to the asset's url. The process of hashing assets then render template with hashed url is hard to maintain and inflexible.
- Static Pipeline is a framework with which you can use whatever processor you want. It will also save each hash assets url. So you can use them with template helper to provide correct assets' urls.

## Install

```sh
npm install --save-dev static-pipeline
```

## Usage

1. Create a `Staticfiles.js` in your root directory.
2. In `Staticfiles.js`, export a object with defination of tasks.

```js
var sass = require('node-sass');

module.exports = {
  scss: {
    files: [{
      src: 'source/app.scss',
      dest: 'public/app.css',
    }],
    process: function (pipeline) {
      sass.render({
        file: pipeline.src,
        success: function (results) {
          pipeline.done(results.css);
        }
      });
    }
  }
};
```

3. Run `static-pipeline` in the same directory as `Staticfile.js`.

## API

### Task Config

In the above example, `scss` is the task name. Each task object has the following properties:

- `files` - `Object[]`: is an array of glob definition. Each glob definition is a object with:
    - `src`: path to input file, relative to `Staticfile.js`.
    - `dest`: relative path to output file.
    - `base`: (optional) relative base path for `src`. If defined, `src` can be a globing pattern appended to `base` (details see [node-glob](https://github.com/isaacs/node-glob#glob-primer)), and `dest` must be a path of a directory. Details see [globing example](#globing-example).
    - `ext`: (optional) a new extension to replace the dest's extension. Ignored if `base` is not defined.
- `process` - `function`: will be called with [`pipeline` helper objects](#pipeline-helper-objects) for each `src` file globed in array.
- `depends` - `string[]`: array of names of other task, which will be executed before current task.

### `pipeline` objects

`pipeline` has following properties, which you can use to complete your build process.

1. `pipeline.src` - `string`: an absolve path of input file.
2. `pipeline.dest` - `string`: an absolve path of output file.
3. `pipeline.done` - `function([string])`: call this function with process is finished. If called with a string or buffer, it will be saved to `dest` file.
4. `pipeline.hash` - `function`: call with content of `dest` to return a object. It has `dest` property which is a hash appended `dest` path, and `hash` property which is a hash string.
5. `pipeline.gitHash` - `function([path|paths], callback)`: call directly, with single path, or array of paths. If with no path, if will use current `src` path. Accept a callback, which will be called with the latest git hash of path or paths.
6. `pipeline.write` - `function(string)`: write content to current `dest` file.

### Globing Example

#### Only `src` and `dest`

Assume current project root is `/home`.
```js
{
  src: 'source/app.scss',
  dest: 'public/app.css'
}
```
Will generate `src` -> `/home/source/app.scss`, `dest` -> `/home/public/app.css`.

#### Define `base` and `src` glob

Assume `source` directory has `file1.scss`, `file2.scss` and `partial/file3.scss`.
```js
{
  base: 'source',
  src: '**/*.scss',
  dest: 'public'
}
```
- `src` -> `/home/source/file1.scss`, `dest` -> `/home/public/file1.scss`
- `src` -> `/home/source/file2.scss`, `dest` -> `/home/public/file2.scss`
- `src` -> `/home/source/partial/file3.scss`, `dest` -> `/home/public/partial/file3.scss`

#### Use `ext`

Assume `source` directory has `file1.scss`, `file2.scss` and `partial/file3.scss`.
```js
{
  base: 'source',
  src: '**/*.scss',
  dest: 'public',
  ext: 'css'
}
```
- `src` -> `/home/source/file1.scss`, `dest` -> `/home/public/file1.css`
- `src` -> `/home/source/file2.scss`, `dest` -> `/home/public/file2.css`
- `src` -> `/home/source/partial/file3.scss`, `dest` -> `/home/public/partial/file3.css`
