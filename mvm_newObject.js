import { exportToC } from './ffi.js';

exportToC('any', 'newObject', [],
  () => {
    return {}
  }
);

exportToC('void', 'setProp', [['any', 'obj'], ['string', 'key'], ['any', 'value']],
  (obj, key, val) => {
    obj[key] = val
  }
);

exportToC('any', 'getProp', [['any', 'obj'], ['string', 'key']],
  (obj, key) => {
    return obj[key]
  }
);