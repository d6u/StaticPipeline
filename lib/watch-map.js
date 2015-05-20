export default class WatchMap {

  constructor() {
    this.map = new Map();
  }

  put(task, srcFile, detail) {
    if (!this.map.has(task)) {
      this.map.set(task, new Map());
    }

    this.map.get(task).set(srcFile, detail);
  }

  has(task, srcFile) {
    if (!this.map.has(task)) return false;
    if (!this.map.get(task).has(srcFile)) return false;
    return true;
  }

  get(task, srcFile) {
    return this.map.get(task).get(srcFile);
  }

  * [Symbol.iterator]() {
    for (let [task, fileMap] of this.map) {
      for (let [srcFile, detail] of fileMap) {
        yield [task, srcFile, detail];
      }
    }
  }

}
