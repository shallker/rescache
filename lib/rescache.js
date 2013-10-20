var NodeHttp = require('node-http'),
    encoding = require('encoding'),
    Promisy = require('promisy'),
    eventy = require('eventy'),
    reges = require('reges'),
    path = require('path'),
    mime = require('mime'),
    MD5 = require('MD5'),
    fs = require('fs');

var cacheFolder = __dirname;

var rescache = function () {
  return this;
}.call(eventy({}));

function error(err) {
  console.log('cache error', err);
}

function toFilepath(url) {
  var urlId = MD5(url);
  var ext = reges.matchExtension(url);
  var filename = ext ? urlId + '.' + ext : urlId;

  return path.resolve(cacheFolder, filename);
}

function createFolder(path, callback, onError) {
  fs.exists(path, function (exists) {
    if (exists) return callback(true);

    fs.mkdir(path, function (err) {
      if (err) return onError(err);
      callback(true);
    });
  });
}

/**
 * Fetch the content from remote by the url
 * @param  String url
 * @param  [Function callback]
 * @param  [Function onError]
 * @return Object cache
 */
function fetch(url, callback, onError) {
  var http = new NodeHttp;

  http.GET(url);

  http.on(200, function (response) {
    var buffer = response.buffer;

    if (response.headers['content-type']) {
      var charset = reges.matchCharset(response.headers['content-type']);

      if (charset && !charset.match(reges.utf8)) {
        buffer = encoding.convert(buffer, 'UTF-8', charset);
      }
    }

    /**
     * Make sure the buffer passed to cache.save() is UTF-8 encoded
     */
    callback(buffer);
  });

  http.on('error', onError);
}

/**
 * Save resource buffer to local file system
 * @param  {String} filepath
 * @param  {Buffer} buffer [Buffer data of the file, UTF-8 encoding]
 * @param  {Function} callback
 * @param  {Function} onError
 * @return {Object} cache
 */
function save(filepath, buffer, callback, onError) {
  fs.writeFile(filepath, buffer, function (err) {
    if (err) return onError(err);
    callback(true);
  });
}

/**
 * rescache option setter
 * @param {String} name
 * @param {String} value
 */
rescache.set = function (name, value) {
  switch (name) {
    case 'cache.folder':
      cacheFolder = value;
      createFolder(cacheFolder, new Function, error);
    break;
  }
}

/**
 * Fetch the content from remote by the url and save it to local file system
 * @param  String url
 * @param  [Function callback]
 * @param  [Function onError]
 * @return Object cache
 */
rescache.cache = function (url, callback, onError) {
  callback = callback || new Function;
  onError = onError || error;

  var promisy = new Promisy;

  promisy(function (next) {
    rescache.has(url, function (has) {
      if (has) return callback(true);
      else next();
    });
  }).then(function () {
    var filepath = toFilepath(url);

    fetch(url, function (buffer) {
      save(filepath, buffer, callback, onError);
      rescache.trigger('cache', url);
    }, onError);
  });
}

/**
 * Force to fetch and save even if the cache exists
 * @param  String url
 * @param  [Function callback]
 * @param  [Function onError]
 */
rescache.recache = function (url, callback, onError) {
  callback = callback || new Function;
  onError = onError || error;

  var promisy = new Promisy;

  promisy(function (next) {
    rescache.has(url, function (has) {
      if (has) {
        rescache.remove(url, function (success) {
          if (success) next();
          else console.log('remove %s failed', url);
        }, onError);
      } else {
        next();
      }
    }, onError);
  }).then(function (next) {
    rescache.cache(url, callback, onError);
    rescache.trigger('recache');
  });
}

/**
 * Read the content from cache by the url
 * @param  {String} url
 * @param  {Function} callback
 * @param  {Function} onError
 * @return {Object} cache
 */
rescache.read = function (url, callback, onError) {
  onError = onError || error;

  var filepath = toFilepath(url);
  var promisy = new Promisy;

  promisy(function (next) {
    rescache.has(url, function (has) {
      if (has) return next();
      else callback(null);
    }, onError);
  }).then(function () {
    fs.stat(filepath, function (err, stat) {
      if (err) return onError(err);
      if (stat.size === 0) return callback(null);

      fs.readFile(filepath, function (err, buffer) {
        if (err) return onError(err);

        var type = mime.lookup(filepath);
        var charset = mime.charsets.lookup(type);

        /**
         * Return raw buffer data of the cached file
         */
        callback({
          mime: type,
          charset: charset,
          buffer: buffer
        });

        rescache.trigger('read', url);
      });
    });
  });
}

/**
 * Detect if there is a cache file available in local file system
 * @param  {String} url
 * @param  {Function} callback
 * @param  {Function} onError
 */
rescache.has = function (url, callback, onError) {
  onError = onError || error;

  var filepath = toFilepath(url);

  fs.exists(filepath, callback, onError);
}

/**
 * Remove cache from local file system by url
 * @param  {String} url
 * @param  {Function} callback
 * @param  {Function} onError
 */
rescache.remove = function (url, callback, onError) {
  callback = callback || new Function;
  onError = onError || error;

  var promisy = new Promisy;

  promisy(function (next) {
    rescache.has(url, function (has) {
      if (has) next();
      else callback(true);
    }, onError);
  }).then(function () {
    var filepath = toFilepath(url);

    fs.unlink(filepath, function (err) {
      if (err) {
        callback(false);
      } else {
        callback(true);
        rescache.trigger('remove', url);
      }
    });
  });
}

module.exports = rescache;
