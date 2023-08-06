export class Store {
  #data = [];

  async push(value) {
    value = await value;
    this.#data.push(value);
  }

  clear() {
    this.#data = [];
  }

  values() {
    return this.#data;
  }
}
