# Static Pipeline

Static Pipeline is not another build system or task runner. It is a static assets processing framework and template helper.

## Why Use Static Pipeline?

Build tools and task runners like Gulp and Grunt all depend on their plugins. Plugins prevents you from using the power of original assets processing tools, e.g. node-sass or browserify. Why bother learning a browserify plugin instead of the browserify itself?

Also for static assets, to bust browser cache, we often append a hash to the asset's url. The process of hashing assets then render template with hashed url is hard to maintain and inflexible.

Static Pipeline is a framework with which you can use whatever processor you want. It will also save each hash assets url. So you can use them with template helper to provide correct assets' urls.

## Install

```js
npm install --save-dev static-pipeline
```

## Usage

1. Create a `Staticfiles.js` in your root directory.
2. Put the following information
