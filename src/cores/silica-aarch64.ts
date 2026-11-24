/**
 * Silica-AArch64 — Functional AArch64 core inspired by Silica-Allah
 *
 * Design principles taken from Silica-Allah:
 *  - Zero external dependencies
 *  - Focus on architectural correctness over cycle accuracy
 *  - Clean decode → execute separation
 *  - Sticky fault / halt model (no exceptions thrown)
 *
 * This is a teaching/research-grade functional subset, not a full Arm ARM.
 * MIT License
 */

import type { EmulatorPlugin, RegisterFile, MemoryRegion, LoadOptions, Capability } from "../plugin";

const MEM_SIZE = 1024 * 1024; // 1 MiB flat memory

export class SilicaAArch64 implements EmulatorPlugin {
  readonly id = "silica-aarch64";
  readonly name = "Silica AArch64 (Functional)";
  readonly version = "0.1.0";
  readonly supportedArchs = ["aarch64"];
  readonly capabilities: Capability[] = ["functional-only"];

  private mem = new Uint8Array(MEM_SIZE);
  private regs = new BigUint64Array(32); // X0–X30 + XZR (we treat 31 as XZR/SP)
  private pc = 0n;
  private sp = 0n;
  private halted = false;
  private running = false;
  private listeners: Record<string, Function[]> = {};

  // PSTATE NZCV (simplified)
  private n = false;
  private z = false;
  private c = false;
  private v = false;

  async load(_options?: LoadOptions): Promise<void> {
    this.reset();
  }

  async start(): Promise<void> {
    this.running = true;
    this.halted = false;
  }

  pause(): void {
    this.running = false;
  }

  resume(): void {
    this.running = true;
    this.halted = false;
  }

  reset(): void {
    this.mem.fill(0);
    this.regs.fill(0n);
    this.pc = 0n;
    this.sp = BigInt(MEM_SIZE - 16);
    this.halted = false;
    this.running = false;
    this.n = this.z = this.c = this.v = false;
  }

  stop(): void {
    this.running = false;
    this.halted = true;
  }

  destroy(): void {
    this.stop();
    this.listeners = {};
  }

  async loadBinary(data: ArrayBuffer | Uint8Array, options?: LoadOptions): Promise<void> {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const entry = options?.entryPoint ?? 0;
    if (entry + bytes.length > MEM_SIZE) {
      throw new Error("Binary too large for 1 MiB memory");
    }
    this.mem.set(bytes, entry);
    this.pc = BigInt(entry);
    if (options?.stackPointer !== undefined) {
      this.sp = BigInt(options.stackPointer);
    }
    this.emit("console", `[silica] loaded ${bytes.length} bytes at 0x${entry.toString(16)}\n`);
  }

  getMemoryMap(): MemoryRegion[] {
    return [
      { name: "RAM", base: 0, size: MEM_SIZE, writable: true },
    ];
  }

  step(n = 1): void {
    for (let i = 0; i < n && !this.halted; i++) {
      this.executeOne();
    }
  }

  runFor(instructions: number): void {
    for (let i = 0; i < instructions && !this.halted && this.running; i++) {
      this.executeOne();
    }
  }

  getRegisters(): RegisterFile {
    const out: RegisterFile = {
      PC: this.pc,
      SP: this.sp,
      NZCV: (this.n ? 8 : 0) | (this.z ? 4 : 0) | (this.c ? 2 : 0) | (this.v ? 1 : 0),
    };
    for (let i = 0; i < 31; i++) {
      out[`X${i}`] = this.regs[i];
    }
    out["XZR"] = 0n;
    return out;
  }

  getMemory(addr: number, len: number): Uint8Array {
    if (addr < 0 || addr + len > MEM_SIZE) {
      return new Uint8Array(len); // fault → zeros (sticky model)
    }
    return this.mem.slice(addr, addr + len);
  }

  setMemory(addr: number, data: Uint8Array): void {
    if (addr < 0 || addr + data.length > MEM_SIZE) return;
    this.mem.set(data, addr);
  }

  getPC(): number {
    return Number(this.pc);
  }

  on(event: "console" | "halt" | "breakpoint", cb: (...args: any[]) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(cb);
  }

  off(event: string, cb: Function): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((f) => f !== cb);
  }

  private emit(event: string, ...args: any[]) {
    (this.listeners[event] || []).forEach((cb) => cb(...args));
  }

  // ─── Decode + Execute (very small functional subset) ───────────────────────

  private executeOne(): void {
    if (this.halted) return;

    const addr = Number(this.pc);
    if (addr + 4 > MEM_SIZE) {
      this.halt("PC out of range");
      return;
    }

    // little-endian 32-bit instruction (force unsigned — JS bitwise is signed)
    const instr =
      (this.mem[addr] |
        (this.mem[addr + 1] << 8) |
        (this.mem[addr + 2] << 16) |
        (this.mem[addr + 3] << 24)) >>> 0;

    this.pc += 4n;

    // NOP (0xD503201F)
    if (instr === 0xd503201f) return;

    // RET (0xD65F03C0) — simplified
    if (instr === 0xd65f03c0) {
      this.pc = this.regs[30]; // X30 = LR
      return;
    }

    // MOVZ Xd, #imm16 (sf=1, opc=10, hw=00..11)
    // Force unsigned masks because JS bitwise is signed
    if (((instr & 0xff800000) >>> 0) === 0xd2800000) {
      const rd = instr & 0x1f;
      const imm16 = (instr >>> 5) & 0xffff;
      const hw = (instr >>> 21) & 0x3;
      const value = BigInt(imm16) << BigInt(hw * 16);
      if (rd !== 31) this.regs[rd] = value;
      return;
    }

    // ADD Xd, Xn, #imm12 (simplified 64-bit immediate add)
    if (((instr & 0xffc00000) >>> 0) === 0x91000000) {
      const rd = instr & 0x1f;
      const rn = (instr >>> 5) & 0x1f;
      const imm12 = (instr >>> 10) & 0xfff;
      const a = rn === 31 ? 0n : this.regs[rn];
      const result = a + BigInt(imm12);
      if (rd !== 31) this.regs[rd] = result;
      return;
    }

    // SUB Xd, Xn, #imm12
    if (((instr & 0xffc00000) >>> 0) === 0xd1000000) {
      const rd = instr & 0x1f;
      const rn = (instr >>> 5) & 0x1f;
      const imm12 = (instr >>> 10) & 0xfff;
      const a = rn === 31 ? 0n : this.regs[rn];
      const result = a - BigInt(imm12);
      if (rd !== 31) this.regs[rd] = result;
      return;
    }

    // B offset (unconditional branch)
    if (((instr & 0xfc000000) >>> 0) === 0x14000000) {
      let imm26 = instr & 0x03ffffff;
      if (imm26 & 0x02000000) imm26 |= 0xfc000000; // sign extend
      // convert to signed 32-bit for the offset calculation
      if (imm26 & 0x80000000) imm26 = imm26 - 0x100000000;
      this.pc = this.pc - 4n + BigInt(imm26 * 4);
      return;
    }

    // HLT / unrecognized → halt (sticky)
    this.halt(`unimplemented instruction 0x${instr.toString(16).padStart(8, "0")} at PC 0x${(this.pc - 4n).toString(16)}`);
  }

  private halt(reason: string) {
    this.halted = true;
    this.running = false;
    this.emit("console", `[silica] HALT: ${reason}\n`);
    this.emit("halt", reason);
  }
}
