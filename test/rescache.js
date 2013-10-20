var test = require('simple-test');
var rescache = require('../index');
var Promisy = require('promisy');

var favicon = 'http://www.baidu.com/favicon.ico';
var html = 'http://www.baidu.com/index.html';
var gb2312 = 'http://www.cr173.com/tags_GB2312.html';
var iso88591 = 'http://www.lemonde.fr';

var url = iso88591;

var promisy = new Promisy;

function onError(err) {
  console.log('error', err);
}

promisy(function (next) {
  test('rescache.set', function (done) {
    test.notThrow(function () {
      rescache.set('cache.folder', __dirname + '/cache');
      done();
      next();
    });
  });
}).then(function (next) {
  test('rescache.cache', function (done) {
    rescache.cache(url, function (succes) {
      test.eq(succes, true);
      done();
      next();
    }, onError);
  });
}).then(function (next) {
  test('rescache.has', function (done) {
    rescache.has(url, function (has) {
      test.eq(has, true);
      done();
      next();
    }, onError);
  });
}).then(function (next) {
  test('rescache.read', function (done) {
    rescache.read(url, function (data) {
      console.log('data', data)
      test.ok(data.mime)
      test.ok(data.buffer)
      done();
      next();
    }, onError);
  });
}).then(function (next) {
  test('rescache.recache', function (done) {
    rescache.recache(url, function (succes) {
      test.eq(succes, true);
      done();
      next();
    }, onError);
  });
}).then(function (next) {
  test('rescache.remove', function (done) {
    rescache.remove(url, function (succes) {
      test.eq(succes, true);
      done();
      next();
    }, onError);
  });
}).then(function (next) {
  test('rescache.has', function (done) {
    rescache.has(url, function (has) {
      test.eq(has, false);
      done();
      next();
    }, onError);
  });
})
