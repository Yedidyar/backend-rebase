import { KeyValueLinkedList, type KeyValueNode } from "./linked-list/index.ts";

export class LRUCacheService {
  private cache: Map<string, KeyValueNode<ArrayBuffer>>;
  private capacity: number;
  private linkedList: KeyValueLinkedList<ArrayBuffer>;

  constructor(capacity: number) {
    this.cache = new Map();
    this.capacity = capacity;
    this.linkedList = new KeyValueLinkedList();
  }

  clear() {
    this.linkedList = new KeyValueLinkedList();
    this.cache = new Map();
  }

  put(id: string, value: ArrayBuffer) {
    console.log(this.cache);

    const node = this.linkedList.add([id, value]);
    this.cache.set(id, node);
    const isMaxCapacity = this.cache.size === this.capacity;
    if (isMaxCapacity) {
      const prevHeadKey = this.linkedList.shift();
      if (prevHeadKey) this.cache.delete(prevHeadKey);
    }
  }

  private moveNodeToTopOfList(node: KeyValueNode<ArrayBuffer>): void {
    this.linkedList.remove(node);
    this.linkedList.add(node.value);
  }

  tryGet(id: string): KeyValueNode<ArrayBuffer> | null {
    const lastNodeUsed = this.cache.get(id);
    if (!lastNodeUsed) return null;
    this.moveNodeToTopOfList(lastNodeUsed);
    return lastNodeUsed;
  }

  remove(id: string) {
    const nodeToRemove = this.cache.get(id);
    if (!nodeToRemove) return;
    this.linkedList.remove(nodeToRemove);
    this.cache.delete(id);
  }
}
