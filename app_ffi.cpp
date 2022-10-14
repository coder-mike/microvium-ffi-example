
// ------------------------- Beginning of implementation -----------------------------
// WARNING: This file is auto-generated. DO NOT EDIT

#include "App_ffi.hpp"

static const mvm_VMExportID _vmExportsIDs[4] = {
  /*[0]*/ 65535, // runRestoreEvents
  /*[1]*/ 65534, // newObject
  /*[2]*/ 65533, // setProp
  /*[3]*/ 65532, // getProp
};

static mvm_Value _vmExports[4];

typedef struct ImportRecord {
  mvm_HostFunctionID id;
  mvm_TfHostFunction func;
} ImportRecord;

static mvm_TeError _print_wrapper(mvm_VM* _vm, mvm_HostFunctionID hostFunctionID, mvm_Value* _result, mvm_Value* _args, uint8_t _argCount);
static mvm_TeError _getResource_wrapper(mvm_VM* _vm, mvm_HostFunctionID hostFunctionID, mvm_Value* _result, mvm_Value* _args, uint8_t _argCount);


static const ImportRecord _vmImports[2] = {
  /*[0]*/ {65535, _print_wrapper},
  /*[1]*/ {65534, _getResource_wrapper},
};

static mvm_TeError resolveImport(mvm_HostFunctionID hostFunctionID, void* context, mvm_TfHostFunction* out_hostFunction);

App::App(const uint8_t* snapshot, size_t snapshotSize): mvm::VM() {
  mvm_TeError err;

  err = mvm_restore(&_vm, (MVM_LONG_PTR_TYPE)snapshot, snapshotSize, this, resolveImport);
  if (err != MVM_E_SUCCESS) MVM_FATAL_ERROR(_vm, err);

  err = mvm_resolveExports(_vm, _vmExportsIDs, _vmExports, 4);
  if (err != MVM_E_SUCCESS) MVM_FATAL_ERROR(_vm, err);

  runRestoreEvents();
}

static mvm_TeError resolveImport(mvm_HostFunctionID hostFunctionID, void* context, mvm_TfHostFunction* out_hostFunction) {
  
  for (int i = 0; i < 2; i++) {
    if (_vmImports[i].id == hostFunctionID) {
      *out_hostFunction = _vmImports[i].func;
      return MVM_E_SUCCESS;
    }
  }
  return MVM_E_FUNCTION_NOT_FOUND;
  
}


void App::runRestoreEvents() {
  
  
  
  mvm_Value _result;

  // Call the JS function
  mvm_TeError err = mvm_call(_vm, _vmExports[0], &_result, NULL, 0);
  if (err != MVM_E_SUCCESS) MVM_FATAL_ERROR(_vm, err);

  // Convert/return the result
  return ;
}

mvm::Any App::newObject() {
  
  
  
  mvm_Value _result;

  // Call the JS function
  mvm_TeError err = mvm_call(_vm, _vmExports[1], &_result, NULL, 0);
  if (err != MVM_E_SUCCESS) MVM_FATAL_ERROR(_vm, err);

  // Convert/return the result
  return mvm::Any(_vm, _result);
}

void App::setProp(mvm::Any obj, std::string key, mvm::Any value) {
  // Prepare the arguments
  mvm_Value _args[3];
  _args[0] = obj.value();
  _args[1] = mvm_newString(_vm, key.c_str(), key.size());
  _args[2] = value.value();
  mvm_Value _result;

  // Call the JS function
  mvm_TeError err = mvm_call(_vm, _vmExports[2], &_result, _args, 3);
  if (err != MVM_E_SUCCESS) MVM_FATAL_ERROR(_vm, err);

  // Convert/return the result
  return ;
}

mvm::Any App::getProp(mvm::Any obj, std::string key) {
  // Prepare the arguments
  mvm_Value _args[2];
  _args[0] = obj.value();
  _args[1] = mvm_newString(_vm, key.c_str(), key.size());
  mvm_Value _result;

  // Call the JS function
  mvm_TeError err = mvm_call(_vm, _vmExports[3], &_result, _args, 2);
  if (err != MVM_E_SUCCESS) MVM_FATAL_ERROR(_vm, err);

  // Convert/return the result
  return mvm::Any(_vm, _result);
}

static mvm_TeError _print_wrapper(mvm_VM* _vm, mvm_HostFunctionID hostFunctionID, mvm_Value* _result, mvm_Value* _args, uint8_t _argCount) {
  App* _app = (App*)mvm_getContext(_vm);

  // Prepare the arguments
  std::string msg = std::string(mvm_toStringUtf8(_vm, _argCount >= 1 ? _args[0] : mvm_undefined, NULL));

  // Call the C function
  print(*_app, msg);

  // Convert the result
  *_result = mvm_undefined;

  return MVM_E_SUCCESS;
}


static mvm_TeError _getResource_wrapper(mvm_VM* _vm, mvm_HostFunctionID hostFunctionID, mvm_Value* _result, mvm_Value* _args, uint8_t _argCount) {
  App* _app = (App*)mvm_getContext(_vm);

  // Prepare the arguments
  std::string name = std::string(mvm_toStringUtf8(_vm, _argCount >= 1 ? _args[0] : mvm_undefined, NULL));

  // Call the C function
  mvm::Any __result = getResource(*_app, name);

  // Convert the result
  *_result = __result.value();

  return MVM_E_SUCCESS;
}

// ------------------------- End of implementation -----------------------------
