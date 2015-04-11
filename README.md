# Static Pipeline

Static Pipeline is not another build system or task runner. It is a static assets processing framework and template helper. You can use whatever assets preprocessor you want.

## Why Use Static Pipeline instead of Gulp or Grunt?

- Build tools and task runners like Gulp and Grunt all depend on their plugins. Plugins prevents you from using the real power of original assets processing tools, e.g. node-sass or browserify. Why bother learning browserify plugin instead of the browserify itself?
- For static assets to bust browser cache, we often append a hash to the asset's url. The process of hashing assets then render template with hashed url is hard to maintain and inflexible.
- Static Pipeline is a framework with which you can use whatever processor you want. It will also save each hash assets url. So you can use them with template helper to provide correct assets' urls.

## Install

```sh
npm install -g static-pipeline
```

## Usage

1. Create a `Staticfiles.js` in your root directory.
2. In `Staticfiles.js`, define tasks by exporting an configuration function:

    ```js
    var sass = require('node-sass');

    module.exports = function(config) {

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
                pipeline.done(results.css);
              }
            });
          }
        }
      };

    };
    ```

3. Run `static-pipeline` command line.

## API

### Tasks

Assign `config.tasks` property with an object. In the example above, `scss` is the task name.

- `files`|`Object[]`: is an array of glob definitions. Each glob definition is
  an object with:
    - `src`: path to input file, relative to `Staticfile.js`.
    - `dest`: relative path to output file.
    - `base`: (optional) relative base path for `src`. If defined, `src` can be
      a globing pattern (details see [node-glob](https://github.com/isaacs/node-
      glob#glob-primer)) appended after `base`, and `dest` must be a directory.
      Details see [globing example](#globing-example).
    - `ext`: (optional) a new extension to replace the input file's extension.
      Ignored if `base` is not defined.
- `process`|`function`: will be called with [`pipeline` objects](#pipeline-
  object) as argument for every `src` file globed in `files` definition.
- `depends`|`string[]`: (optional) names of other tasks that should run before
  current one.

### `pipeline` object

`pipeline` has following properties/methods. They essentially are just helpers to complete the build process.

1. `pipeline.src`|`string`: absolve path of input file.
2. `pipeline.dest`|`string`: absolve path of output file.
3. `pipeline.done`|`function([path, ][content])`: call this function to indicate process is finished. The first argument is the path of output file, if ignored it will use the `pipeline.dest` as the output path. If called with content string, content will be saved to `path` so you don't have to save output file manually.
4. `pipeline.write`|`function(path, content)`: write `content` to `path`. Similar to `pipeline.done`, but doesn't indicate current task is finished.
5. `pipeline.hash`|`function(string) -> Object`: call with the content of `dest`. It return an object. The object has `dest` property that is new `dest` path with MD5 hash appended, and `hash` property that is the MD5 hash string.
6. `pipeline.gitHash`|`function([string|Array, ]callback)`: see [`githash` helper](#githash-helper).

### File Globing Examples

#### Only `src` and `dest`

Assume current project root is `/home`.
```js
{
  src: 'source/app.scss',
  dest: 'public/app.css'
}
```
Will generate
- `src` -> `/home/source/app.scss`, `dest` -> `/home/public/app.css`.

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

### `gitHash` helper

Git hash is an alternative to MD5 hash. This helper will obtain the git commit hash for specified file. If an array of files are provided, it will select the lastest git commit hash among provided files.

Signature: `function([string|Array, ]callback)`

- If called with only `callback`, it will use current `src` file to get git commit hash.
- With single path, will use provided path to get git commit hash.
- With array of paths, will get git hash for all the files in array, then select the lastest commit.
- Callback signature `function(Error, string)`: **error will occur if one of the paths has changes that are not committed**. `string` will be a git commit hash string.
