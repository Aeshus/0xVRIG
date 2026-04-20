export interface GOTEntry {
  name: string;
  addr: number;
  value: number;
  resolved: boolean;
  overwritten: boolean;
}

export interface ShadowEntry {
  addr: number;
  realRet: number;
  shadowRet: number;
  mismatch: boolean;
}

export interface MemRegion {
  name: string;
  start: number;
  end: number;
  perms: string; // e.g. "RW-", "R-X"
  highlight?: boolean;
  blocked?: boolean;
}

export interface CFITarget {
  addr: number;
  name: string;
  valid: boolean;
  attempted?: boolean;
}

export class AuxViz {
  got: GOTEntry[] = [];
  shadow: ShadowEntry[] = [];
  memMap: MemRegion[] = [];
  cfiTargets: CFITarget[] = [];

  clearAll(): void {
    this.got = [];
    this.shadow = [];
    this.memMap = [];
    this.cfiTargets = [];
  }

  setGOT(entries: GOTEntry[]): void {
    this.got = entries;
  }

  addGOTEntry(entry: GOTEntry): void {
    const idx = this.got.findIndex(e => e.name === entry.name);
    if (idx >= 0) this.got[idx] = entry;
    else this.got.push(entry);
  }

  setShadow(entries: ShadowEntry[]): void {
    this.shadow = entries;
  }

  setMemMap(regions: MemRegion[]): void {
    this.memMap = regions;
  }

  setCFITargets(targets: CFITarget[]): void {
    this.cfiTargets = targets;
  }
}
