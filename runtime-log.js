import { importFromC, onRestore } from './ffi.js'

const runtimeLogFunc = importFromC('void', 'print', [['string', 'msg']]);
onRestore(() => console.log = runtimeLogFunc);
