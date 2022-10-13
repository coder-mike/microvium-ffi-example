// Note: there seems to be a bug in Microvium that an import like
// `import './mvm_newObject.js'` doesn't actually execute the module.
import foo from './mvm_newObject.js'
import bar from  './runtime-log.js'
import { generate, onRestore } from './ffi.js'

onRestore(() => {
  console.log('Hello, World!');
});

generate();