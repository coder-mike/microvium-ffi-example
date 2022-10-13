# Microvium FFI Example

Please make PRs against this repo if you have any improvements. This is a library for code-generating FFI code for Microvium. I've labelled it as an "example" because I don't think it's yet at a standard where I feel comfortable publishing it as an actual library (e.g. on npm). So it's in some sense an example to get you started with your own FFI generator.

To build the example: `microvium main.js`

As of this writing, I haven't actually tested it at all. So, beware.

## Explanation

The bottom of the abstraction hierarchy here is `ffi.js` which exports the function `generate`. It uses the `fs` node module (only available at compile time) to code-generate glue code.

The module `mvm_newObject.js` is an example that uses this module to export a few functions for manipulating Microvium objects from C.

The module `runtime-log.js` is an example that imports a hypothetical "print" function from C and uses it to replace `console.log` at runtime.

