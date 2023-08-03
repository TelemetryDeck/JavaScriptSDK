export class TimelineStore {
  #data = new Map();
  #monotone = 0;

  async push(value) {
    const key = this.#monotone;
    this.#monotone += 1;
    this.#data.set(key, await value);
  }

  clear() {
    this.#data.clear();
    this.#monotone = 0;
  }

  get values() {
    return [...this.#data.entries()].sort().map(([, value]) => value);
  }
}
