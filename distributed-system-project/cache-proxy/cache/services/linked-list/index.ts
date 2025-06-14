export interface KeyValueNode<T> {
  prev: KeyValueNode<T> | null;
  value: [string, T];
  next: KeyValueNode<T> | null;
}

export class KeyValueLinkedList<T> {
  private head: KeyValueNode<T> | null;
  private tail: KeyValueNode<T> | null;

  constructor() {
    this.head = null;
    this.tail = null;
  }

  shift(): string | null {
    if(!this.head) return null
    const keyOfHead = this.head.value[0];
    this.head = this.head.next;
    return keyOfHead; 
  }

  add(value: [string, T]): KeyValueNode<T> {
    const isListEmpty = !this.head && !this.tail
    if (isListEmpty) {
      const current: KeyValueNode<T> = { prev: null, value, next: null };
      this.head = current;
      this.tail = current;
      return current;
    }
    
    if (this.head === this.tail) {
      const current: KeyValueNode<T> = { prev: this.head, value, next: null };
      this.head!.next = current;
      this.tail = current;
      return current;
    }

    const current: KeyValueNode<T> = { prev: this.tail, value, next: null };
    this.tail = current;
    
    return current;
  }

  remove(nodeToRemove: KeyValueNode<T>) {
    const isHead = nodeToRemove === this.head;
    const isTail = nodeToRemove === this.head;
    const isSingleNode = isHead && isTail;
    if (isSingleNode) {
      this.head = null
      this.tail = null
      return
    }
    if (isHead) {
      this.head = nodeToRemove.next
      return
    }
    if (isTail) {
      this.tail = nodeToRemove.prev
      return
    }
    const parentOfNode = nodeToRemove.prev!;
    const childOfNode = nodeToRemove.next!;
    parentOfNode.next = childOfNode
    childOfNode.prev = parentOfNode
    return
  }

  getHead(): KeyValueNode<T> | null {
    return this.head;
  }

  getTail(): KeyValueNode<T> | null {
    return this.tail;
  }

  // for debugging
  *[Symbol.iterator]() {
    let curr: KeyValueNode<T> | null = this.head;
    while (curr) {
      yield curr.value;
      curr = curr.next;
    }
  }
}
