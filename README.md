rescache
==========

Resource caching


## Installation
```bash
npm install rescache
```

## Quick Start
```javascript
var rescache = require('rescache');

rescache.cache('https://github.com/favicon.ico');

rescache.read('https://github.com/favicon.ico', function (data) {
  console.log(data.mime);
  console.log(data.charset);
  console.log(data.buffer.toString('base64'));
});

rescache.remove('https://github.com/favicon.ico');
```

## API
### rescache
#### .cache(String url, [Function callback], [Function onError])
#### .recache(String url, [Function callback], [Function onError])
#### .remove(String url, [Function callback], [Function onError])
#### .read(String url, Function callback, [Function onError])
#### .has(String url, Function callback, [Function onError])

## License

  MIT
