
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

class App: public mvm::VM {
public:
  App(const uint8_t* snapshot, size_t snapshotSize);

  void restore(const uint8_t* snapshot, size_t snapshotSize);
  void free();

  
  void runRestoreEvents();
  mvm::Any newObject();
  void setProp(mvm::Any obj, std::string key, mvm::Any value);
  mvm::Any getProp(mvm::Any obj, std::string key);
};


extern void print(App& app, std::string msg); // Must be implemented elsewhere
extern mvm::Any getResource(App& app, std::string name); // Must be implemented elsewhere

// --------------------------- End of header --------------------------------
