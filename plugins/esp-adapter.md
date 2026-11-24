# Adapter Notes: Official esp-emulator Wasm

The official Espressif `esp-emulator` already ships a WebAssembly build and a GitHub Pages demo:

https://espressif.github.io/esp-emulator/

## How to plug it into SilicaHost

1. Obtain the official Wasm artifacts from the esp-emulator releases or build them yourself.
2. Create a thin TypeScript class that implements the `EmulatorPlugin` interface in `src/plugin.ts`.
3. Inside `loadBinary`, pass the merged flash image to the esp-emulator Wasm instance the same way the official web demo does.
4. Forward console output, GPIO snapshots and (optionally) network events through the plugin event system.
5. Register the plugin with the host.

Because both the host and the official emulator are MIT-compatible (Apache-2.0 for esp-emulator is permissive and can be used alongside MIT), the combined system remains freely redistributable under MIT for the SilicaHost code itself.

No source from esp-emulator is copied into this repository; only an adapter surface is described.
