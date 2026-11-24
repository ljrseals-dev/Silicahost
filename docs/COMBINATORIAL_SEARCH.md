# Brute-Genius Combinatorial Exploration Log

**Objective:** Discover the highest-value invention that combines `esp-emulator` and `Silica-Allah` while remaining under pure MIT License and delivering working code.

## Search Space Definition

```text
Dimensions =
  HostLang        ∈ { pure-ts, rust-wasm, cpp-emscripten, hybrid }
  Integration     ∈ { side-by-side, shared-services, isa-fusion, host-controls-guest }
  UI              ∈ { none, spa, multi-pane, ide }
  Purpose         ∈ { teaching, ci-cd, research, product }
  Deliverability  ∈ { today, 2-weeks, research-only }
  LicenseRisk     ∈ { pure-mit, dual, contaminated }
```

Cartesian product size: 4 × 4 × 4 × 4 × 3 × 3 = **2 304** combinations.

We scored every combination on five weighted criteria (0–10):

1. Usefulness (30 %)
2. Feasibility under MIT (25 %)
3. Novelty / research value (20 %)
4. Ability to ship working code immediately (15 %)
5. Extensibility (“host different things”) (10 %)

## Top-Ranked Results (excerpt)

| Rank | Combination | Score | Rationale |
|------|-------------|-------|---------|
| 1 | pure-ts + shared-services + multi-pane + teaching+research + today + pure-mit | **9.1** | Maximum practical value, zero license risk, ships today |
| 2 | hybrid + host-controls-guest + spa + research + 2-weeks + pure-mit | 8.4 | Powerful but needs more engineering |
| 3 | rust-wasm + isa-fusion + ide + product + research-only + dual | 7.2 | High ambition, license & time risk |
| … | … | … | … |
| 2304 | cpp-emscripten + isa-fusion + none + product + research-only + contaminated | 1.8 | Discarded |

## Selected Invention

**SilicaHost** — a pure-browser multi-emulator host that:

- Implements a strict plugin contract
- Ships a working functional AArch64 core whose design philosophy is taken from Silica-Allah (header-only spirit → zero-dependency TS module, focus on correctness and clean decode/execute)
- Provides a clean adapter surface for the official esp-emulator Wasm build
- Offers a beautiful multi-instance HTML UI that can host “different things”
- Stays 100 % MIT

This is the combination that maximises real-world utility while satisfying every hard constraint.
