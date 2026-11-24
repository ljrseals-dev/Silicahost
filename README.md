# SilicaHost

**MIT-licensed multi-emulator host for the browser.**

SilicaHost is the result of an exhaustive combinatorial exploration (Brute-Genius style) of every practical way to combine:

- **Espressif `esp-emulator`** (full-system ESP32-series emulator, Rust, already has Wasm)
- **`ljrseals-dev/Silica-Allah`** (zero-dependency AArch64 functional simulator core, C++20)

## Invention Summary (Brute-Genius Result)

After enumerating the Cartesian product of the following discrete axes:

| Axis | Options |
|------|---------|
| Host language | Pure JS/TS, Rust/Wasm, C++/Emscripten, Hybrid |
| Integration depth | Side-by-side only, Shared services, Deep ISA fusion, Host-controlled guest |
| UI surface | CLI, Single-page HTML, Multi-pane IDE-like, Headless |
| License constraint | Strict MIT (no copyleft contamination) |
| Deliverability | Working code today vs research prototype |
| Primary value | Teaching, CI, Research, Product |

**Winning combination (highest score):**

> Pure-browser TypeScript host + clean plugin contract + functional AArch64 core inspired by Silica-Allah’s design philosophy + adapter surface for the official esp-emulator Wasm + beautiful multi-instance HTML UI.

This maximises:
- Immediate usability
- MIT purity
- Extensibility (“host different things”)
- Educational and research value
- Zero native install

## Features

- Plugin architecture (any emulator that implements the contract can be hosted)
- Built-in functional AArch64 core (Silica-inspired, pure TS, no dependencies)
- Multi-instance support
- Live register & memory viewers
- Console output
- Drag-and-drop binary loading
- Fully static – works from `file://` or any static host (GitHub Pages, etc.)
- MIT License

## Quick Start

```bash
# Just open the HTML
open public/index.html

# Or serve it
npx serve public
```

No build step required for the demo. The TypeScript sources are provided for development.

## Repository Layout

```
silica-host/
├── LICENSE
├── README.md
├── docs/
│   └── COMBINATORIAL_SEARCH.md    # Full Brute-Genius exploration log
├── public/
│   └── index.html                 # Fully functional single-page app
├── src/
│   ├── plugin.ts                  # Plugin contract
│   ├── host.ts                    # Host runtime
│   └── cores/
│       └── silica-aarch64.ts      # Functional AArch64 core
└── plugins/
    └── esp-adapter.md             # How to wire the real esp-emulator Wasm
```

## License

MIT. See [LICENSE](LICENSE).

Both original projects remain under their own licenses. This repository only contains original code and clean adapters.
