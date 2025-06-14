interface KeyValueNode<T> {
  prev: KeyValueNode<T> | null;
  value: [string, T];
  next: KeyValueNode<T> | null;
}

const KEY_INDEX = 0;

export class KeyValueLinkedList<T> {
  private head: KeyValueNode<T> | null;
  private tail: KeyValueNode<T> | null;

  constructor() {
    this.head = null;
    this.tail = null;
  }
  add(value: [string, T]) {
    let curr: KeyValueNode<T> | null = this.head;
    if (condition) {
        while (curr) {
          if (curr.value[KEY_INDEX] === value[KEY_INDEX]) {
            curr.value = value;
            return;
          }
          curr = curr.next;
        }
    }

    this.head = {
      prev: this.head.prev,
      value,
      next: this.head,
    };
  }

  get(key: string) {
    let curr: KeyValueNode<T> | null = this.head;
    while (curr) {
      if (curr.value[KEY_INDEX] === key) {
        return curr.value;
      }
      curr = curr.next;
    }
    return null;
  }

  remove(key: string) {
    let curr: KeyValueNode<T> | null = this.head;
    let prev: KeyValueNode<T> | null = null;

    while (curr) {
      if (curr.value[KEY_INDEX] === key) {
        if (prev) {
          prev.next = curr.next;
        } else {
          this.head = null;
        }
        return curr.value;
      }
      prev = curr;
      curr = curr.next;
    }
    return null;
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
