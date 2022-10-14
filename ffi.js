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
const memberDeclarations = [];
const internalHeaders = [];
const implementations = [];

const onRestoreListeners = [];

const typeToCLookup = {
  void: 'void',
  any: 'mvm::Any',
  bool: 'bool',
  string: 'std::string',
  int: 'int32_t',
  float: 'double',
}

/** * Export a JavaScript function to be called from C
 */
export function exportToC(returnType, name, args, func) {
  const cSignature = emitSignature(returnType, name, args);

  const exportInfo = getNextExportID(name);

  const header = `\n  ${cSignature};`
  const implementation = appName => `
${emitSignature(returnType, `${appName}::${name}`, args)} {
  ${args.length ? `// Prepare the arguments` : ''}
  ${args.length ? `mvm_Value _args[${args.length}];` : ''}
  ${join(map(args, (a, i) => `_args[${i}] = ${emitIncomingConversion(a[0], a[1])};`), '\n  ')}
  mvm_Value _result;

  // Call the JS function
  mvm_TeError err = mvm_call(_vm, _vmExports[${exportInfo.index}], &_result, ${args.length ? '_args' : 'NULL'}, ${args.length});
  if (err != MVM_E_SUCCESS) MVM_FATAL_ERROR(_vm, err);

  // Convert/return the result
  return ${emitOutgoingConversion(returnType, '_result')};
}`;

  memberDeclarations.push(header);
  implementations.push(implementation);

  vmExport(exportInfo.id, func);
}

function emitSignature(returnType, name, args) {
  return `${typeToC(returnType)} ${name}(${join(map(args, emitArg), ', ')})`
}

export function importFromC(returnType, name, args) {
  const cSignature = appName => `${typeToC(returnType)} ${name}(${appName}& app, ${join(map(args, emitArg), ', ')})`;
  const header = appName => `\nextern ${cSignature(appName)}; // Must be implemented elsewhere`
  headers.push(header);

  const wrapperName = `_${name}_wrapper`;
  const importInfo = getNextImportID(wrapperName);
  const wrapperSignature = `static mvm_TeError ${wrapperName}(mvm_VM* _vm, mvm_HostFunctionID hostFunctionID, mvm_Value* _result, mvm_Value* _args, uint8_t _argCount)`;
  internalHeaders.push(`${wrapperSignature};`);

  const implementation = appName => `
${wrapperSignature} {
  ${appName}* _app = (${appName}*)mvm_getContext(_vm);

  // Prepare the arguments
  ${join(map(args, emitImportArg), '\n  ')}

  // Call the C function
  ${returnType === 'void' ? '' : `${typeToC(returnType)} __result = `}${name}(*_app, ${join(map(args, a => a[1]), ', ')});

  // Convert the result
  ${returnType === 'void' ? `*_result = mvm_undefined;` : `*_result = ${emitIncomingConversion(returnType, '__result')};` }

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
  onRestoreListeners.push(func);
}

function emitArg(arg) {
  return `${typeToC(arg[0])} ${arg[1]}`;
}

function emitIncomingConversion(type, name) {
  switch (type) {
    case 'any': return `${name}.value()`;
    case 'bool': return `mvm_newBoolean(${name})`;
    case 'int': return `mvm_newInt32(_vm, ${name})`;
    case 'float': return `mvm_newNumber(_vm, ${name})`;
    case 'string': return `mvm_newString(_vm, ${name}.c_str(), ${name}.size())`;
    default: return `/* unknown arg type ${type} for arg ${name} */`;
  }
}

function emitOutgoingConversion(type, value) {
  switch (type) {
    case 'void': return ``;
    case 'any': return `mvm::Any(_vm, ${value})`;
    case 'bool': return `mvm_toBool(${value})`;
    case 'int': return `mvm_toInt32(_vm, ${value})`;
    case 'float': return `mvm_toFloat64(_vm, ${value})`;
    case 'string': return `std::string(mvm_toStringUtf8(_vm, ${value}, NULL))`;
    default: return `/* unknown return type ${type} */`;
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
  appName = appName || 'App';

  const ffiHeaderName = `${appName}_ffi.hpp`;
  const ffiImplementationName = `${appName}_ffi.cpp`;

  const header = `
// ------------------------- Beginning of header -----------------------------
// WARNING: This file is auto-generated. DO NOT EDIT

#pragma once

#include <stdbool.h>
#include <stdint.h>
#include <stddef.h>
#include <string>
#include <vector>
#include <stdexcept>
#include "microvium.h"

namespace mvm {
  // Oi, this needs a refactor
  struct Any {
    Any(mvm_VM* vm, mvm_Value value): _vm(vm) { mvm_initializeHandle(_vm, &_handle); mvm_handleSet(&_handle, value); }
    Any(const Any& other): _vm(other._vm) { mvm_initializeHandle(_vm, &_handle); mvm_handleSet(&_handle, other.value()); }
    ~Any() { mvm_releaseHandle(_vm, &_handle); }
    mvm_Value value() const { return mvm_handleGet(&_handle); }

    mvm_TeType type() const { return mvm_typeOf(_vm, value()); }

    bool toBool() const { return mvm_toBool(_vm, value()); }
    int32_t toInt32() const { return mvm_toInt32(_vm, value()); }
    MVM_FLOAT64 toFloat64() const { return mvm_toFloat64(_vm, value()); }
    std::string toString() const { size_t n; const char* s = mvm_toStringUtf8(_vm, value(), &n); return std::string(s, n); }

    std::vector<uint8_t> uint8ArrayToBytes() const {
      uint8_t* d; size_t n;
      if (mvm_uint8ArrayToBytes(_vm, value(), &d, &n) != MVM_E_SUCCESS)
        throw std::runtime_error("Microvium error");
      return std::vector<uint8_t>(d, d + n);
    }

    bool isNaN() const { return mvm_isNaN(value()); }
  private:
    mvm_VM* _vm;
    mvm_Handle _handle;
  };

  class VM {
  public:
    ~VM() { mvm_free(_vm); _vm = NULL; }

    Any newBoolean(bool value) { return Any(_vm, mvm_newBoolean(value)); }
    Any newInt32(int32_t value) { return Any(_vm, mvm_newInt32(_vm, value)); }
    Any newNumber(MVM_FLOAT64 value) { return Any(_vm, mvm_newNumber(_vm, value)); }
    Any newString(const std::string& value) { return Any(_vm, mvm_newString(_vm, value.c_str(), value.length())); }
    Any uint8ArrayFromBytes(std::vector<uint8_t> value) { return Any(_vm, mvm_uint8ArrayFromBytes(_vm, value.data(), value.size())); }

    mvm_VM* vm() { return _vm; }
  protected:
    VM(): _vm(NULL) {}
    mvm_VM* _vm;
  };
}

class ${appName}: public mvm::VM {
public:
  ${appName}(const uint8_t* snapshot, size_t snapshotSize);

  void restore(const uint8_t* snapshot, size_t snapshotSize);
  void free();

  ${join(memberDeclarations, '')}
};

${join(map(headers, h => h(appName)), '')}

// --------------------------- End of header --------------------------------
`;

  // Note: I'm using underscores on a bunch of the definitions just as a
  // cheap/bad way of avoiding clashes with user-defined variables and arguments.
  const implementation = `
// ------------------------- Beginning of implementation -----------------------------
// WARNING: This file is auto-generated. DO NOT EDIT

#include "${ffiHeaderName}"

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

${appName}::${appName}(const uint8_t* snapshot, size_t snapshotSize): mvm::VM() {
  mvm_TeError err;

  err = mvm_restore(&_vm, (MVM_LONG_PTR_TYPE)snapshot, snapshotSize, this, resolveImport);
  if (err != MVM_E_SUCCESS) MVM_FATAL_ERROR(_vm, err);

  err = mvm_resolveExports(_vm, _vmExportsIDs, _vmExports, ${exports.length});
  if (err != MVM_E_SUCCESS) MVM_FATAL_ERROR(_vm, err);

  runRestoreEvents();
}

static mvm_TeError resolveImport(mvm_HostFunctionID hostFunctionID, void* context, mvm_TfHostFunction* out_hostFunction) {
  ${!imports.length ? `// There are no exports\n  return MVM_E_FUNCTION_NOT_FOUND;` : `
  for (int i = 0; i < ${imports.length}; i++) {
    if (_vmImports[i].id == hostFunctionID) {
      *out_hostFunction = _vmImports[i].func;
      return MVM_E_SUCCESS;
    }
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