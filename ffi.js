import * as fs from 'fs';
import { map, join } from './utils.js'

// Note: I'm starting at 0xFFFF and going backwards because manually exported
// IDs are likely to start at the lower range, so there's less likely to be
// collisions.

const exports = [];
let nextExportID = 0xFFFF;

const imports = [];
let nextImportID = 0xFFFF;

const headers = [];
const internalHeaders = [];
const implementations = [];

const onRestoreListeners = [];

const typeToCLookup = {
  void: 'void',
  any: 'mvm_Value',
  bool: 'bool',
  string: 'const char*',
  int: 'int32_t',
  float: 'double',
}

/** * Export a JavaScript function to be called from C
 */
export function exportToC(returnType, name, args, func) {
  const cSignature = emitSignature(returnType, name, args);

  const exportInfo = getNextExportID(name);

  const header = `\n${cSignature};`
  const implementation = appName => `
${cSignature} {
  mvm_VM* _vm = ${appName}_vm;

  // Prepare the arguments
  ${args.length ? `mvm_Value _args[${args.length}];` : ''}
  ${join(map(args, (a, i) => `_args[${i}] = ${emitIncomingConversion(a[0], a[1])};`), '\n  ')}
  mvm_Value _result;

  // Call the JS function
  mvm_TeError err = mvm_call(${appName}_vm, _vmExports[${exportInfo.index}], &_result, ${args.length ? '_args' : 'NULL'}, ${args.length});
  if (err != MVM_E_SUCCESS) MVM_FATAL_ERROR(_vm, err);

  // Convert/return the result
  return ${emitOutgoingConversion(returnType, '_result')};
}`;

  headers.push(header);
  implementations.push(implementation);

  vmExport(exportInfo.id, func);
}

function emitSignature(returnType, name, args) {
  return `${typeToC(returnType)} ${name}(${join(map(args, emitArg), ', ')})`
}

export function importFromC(returnType, name, args) {
  const cSignature = emitSignature(returnType, name, args);
  const header = `\nextern ${cSignature}; // Must be implemented elsewhere`
  headers.push(header);

  const wrapperName = `_${name}_wrapper`;
  const importInfo = getNextImportID(wrapperName);
  const wrapperSignature = `static mvm_TeError ${wrapperName}(mvm_VM* _vm, mvm_HostFunctionID hostFunctionID, mvm_Value* _result, mvm_Value* _args, uint8_t _argCount)`;
  internalHeaders.push(`${wrapperSignature};`);

  const implementation = appName => `
${wrapperSignature} {
  // Prepare the arguments
  ${join(map(args, emitImportArg), '\n  ')}

  // Call the C function
  ${returnType === 'void' ? '' : `${typeToC(returnType)} __result = `}${name}(${join(map(args, a => a[1]), ', ')});

  // Convert the result
  ${returnType === 'void' ? `*_result = mvm_undefined;` : `*_result = ${emitIncomingConversion(returnType, '__result')}` }

  return MVM_E_SUCCESS;
}
`
  implementations.push(implementation);

  return vmImport(importInfo.id);
}

function emitImportArg(arg, i) {
  const type = arg[0];
  const name = arg[1];
  return `${typeToC(type)} ${name} = ${emitOutgoingConversion(type, `_argCount >= ${i + 1} ? _args[${i}] : mvm_undefined`)};`
}

/**
 * Run a function when the VM is restored
 */
export function onRestore(func) {
  onRestoreListeners.push();
}

function emitArg(arg) {
  return `${typeToC(arg[0])} ${arg[1]}`;
}

function emitIncomingConversion(type, name) {
  switch (type) {
    case 'any': return name;
    case 'bool': return `mvm_newBoolean(${name});`;
    case 'int': return `mvm_newInt32(_vm, ${name});`;
    case 'float': return `mvm_newNumber(_vm, ${name});`;
    case 'string': return `mvm_newString(_vm, ${name}, strlen(${name}));`;
    default: return `/* unknown arg type ${type} for arg ${name} */`;
  }
}

function emitOutgoingConversion(type, value) {
  switch (type) {
    case 'void': return ``;
    case 'any': return value;
    case 'bool': return `mvm_toBool(${value});`;
    case 'int': return `mvm_toInt32(_vm, ${value});`;
    case 'float': return `mvm_toFloat64(_vm, ${value});`;
    case 'string': return `mvm_toStringUtf8(_vm, ${value}, NULL);`;
    default: return `/* unknown return type ${type} */;`;
  }
}

function getNextExportID(name) {
  const id = nextExportID--;
  const index = exports.length;
  const exportInfo = { name, id, index };
  exports.push(exportInfo);
  return exportInfo;
}

function getNextImportID(name) {
  const id = nextImportID--;
  const index = imports.length;
  const importInfo = { name, id, index };
  imports.push(importInfo);
  return importInfo;
}

export function generate(appName) {
  appName = appName || 'app';

  const ffiHeaderName = `${appName}_ffi.h`;
  const ffiImplementationName = `${appName}_ffi.c`;

  const header = `
// ------------------------- Beginning of header -----------------------------
// WARNING: This file is auto-generated. DO NOT EDIT

#pragma once

#include <stdbool.h>
#include <stdint.h>
#include <stddef.h>
#include "microvium.h"

#ifdef __cplusplus
extern "C" {
#endif

extern mvm_VM* ${appName}_vm;

void ${appName}_restore(const uint8_t* snapshot, size_t snapshotSize);
void ${appName}_free();

${join(headers, '')}

#ifdef __cplusplus
} // extern "C"
#endif

// --------------------------- End of header --------------------------------
`;

  // Note: I'm using underscores on a bunch of the definitions just as a
  // cheap/bad way of avoiding clashes with user-defined variables and arguments.
  const implementation = `
// ------------------------- Beginning of implementation -----------------------------
// WARNING: This file is auto-generated. DO NOT EDIT

#include "${ffiHeaderName}"

mvm_VM* ${appName}_vm = NULL;

static const mvm_VMExportID _vmExportsIDs[${exports.length}] = {
  ${join(map(exports, (e, i) => `/*[${i}]*/ ${e.id}, // ${e.name}`), '\n  ')}
};

static mvm_Value _vmExports[${exports.length}];

typedef struct ImportRecord {
  mvm_HostFunctionID id;
  mvm_TfHostFunction func;
} ImportRecord;

${join(internalHeaders, '\n')}

${!imports.length ? '' : `
static const ImportRecord _vmImports[${imports.length}] = {
  ${join(map(imports, (im, i) => `/*[${i}]*/ {${im.id}, ${im.name}},`), '\n  ')}
};`
}

static mvm_TeError resolveImport(mvm_HostFunctionID hostFunctionID, void* context, mvm_TfHostFunction* out_hostFunction);

void ${appName}_restore(const uint8_t* snapshot, size_t snapshotSize) {
  mvm_TeError err;

  err = mvm_restore(&${appName}_vm, (MVM_LONG_PTR_TYPE)snapshot, snapshotSize, NULL, resolveImport);
  if (err != MVM_E_SUCCESS) MVM_FATAL_ERROR(_vm, err);

  err = mvm_resolveExports(&${appName}_vm, _vmExportsIDs, _vmExports, ${exports.length});
  if (err != MVM_E_SUCCESS) MVM_FATAL_ERROR(_vm, err);

  runRestoreEvents();
}

void ${appName}_free() {
  if (!${appName}_vm) return;
  mvm_free(${appName}_vm);
  ${appName}_vm = NULL;
}

static mvm_TeError resolveImport(mvm_HostFunctionID hostFunctionID, void* context, mvm_TfHostFunction* out_hostFunction) {
  ${!imports.length ? `// There are no exports\n  return MVM_E_FUNCTION_NOT_FOUND;` : `
  for (int i = 0; i < ${imports.length}; i++) {
    if (_vmImports[i].id == hostFunctionID) return _vmImports[i].func;
  }
  return MVM_E_FUNCTION_NOT_FOUND;
  `}
}

${join(map(implementations, i => i(appName)), '\n')}
// ------------------------- End of implementation -----------------------------
`

  fs.writeFileSync(ffiHeaderName, header);
  fs.writeFileSync(ffiImplementationName, implementation);
}

function typeToC(typename) {
  return typeToCLookup[typename] || `/* unknown type ${typename} */`
}

exportToC('void', 'runRestoreEvents', [], () => {
  const len = onRestoreListeners.length;
  for (let i = 0; i < len; i++) {
    onRestoreListeners[i]();
  }
});