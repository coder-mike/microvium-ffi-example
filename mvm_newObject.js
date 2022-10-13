import { exportToC } from './ffi.js';

exportToC('void', 'mvm_newObject', [],
  () => {
    return {}
  }
);

exportToC('void', 'mvm_setProp', [['any', 'obj'], ['string', 'key'], ['any', 'value']],
  (obj, key, val) => {
    obj[key] = val
  }
);

exportToC('any', 'mvm_getProp', [['any', 'obj'], ['string', 'key']],
  (obj, key) => {
    return obj[key]
  }
);

