// Note: there seems to be a bug in Microvium that an import like
// `import './mvm_newObject.js'` doesn't actually execute the module.
import foo from './mvm_newObject.js'
import bar from  './runtime-log.js'
import { generate, onRestore, importFromC } from './ffi.js'

const getResource = importFromC('any', 'getResource', [['string', 'name']]);

onRestore(() => {
  console.log('Starting!');
  console.log('Getting resource...')
  const res = getResource("@root");
  console.log(`The resource's name is "${res.name}"`)
});

generate();