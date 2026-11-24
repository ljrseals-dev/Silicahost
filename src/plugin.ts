/**
 * SilicaHost Plugin Contract
 * MIT License
 *
 * Any emulator that implements this interface can be hosted.
 */

export type Capability =
  | "network"
  | "gpio"
  | "gdb"
  | "trace"
  | "multi-core"
  | "functional-only";

export interface RegisterFile {
  [name: string]: bigint | number;
}

export interface MemoryRegion {
  name: string;
  base: number;
  size: number;
  writable: boolean;
}

export interface LoadOptions {
  entryPoint?: number;
  stackPointer?: number;
}

export interface EmulatorPlugin {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly supportedArchs: string[];
  readonly capabilities: Capability[];

  load(options?: LoadOptions): Promise<void>;
  start(): Promise<void>;
  pause(): void;
  resume(): void;
  reset(): void;
  stop(): void;
  destroy(): void;

  loadBinary(data: ArrayBuffer | Uint8Array, options?: LoadOptions): Promise<void>;
  getMemoryMap(): MemoryRegion[];

  step(n?: number): void;
  runFor(instructions: number): void;

  getRegisters(): RegisterFile;
  getMemory(addr: number, len: number): Uint8Array;
  setMemory(addr: number, data: Uint8Array): void;
  getPC(): number;

  on(event: "console" | "halt" | "breakpoint", cb: (...args: any[]) => void): void;
  off(event: string, cb: Function): void;
}
