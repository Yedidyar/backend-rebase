interface KeyValueNode<T> {
  value: [string, T];
  next: KeyValueNode<T> | null;
}

class KeyValueLinkedList<T> {
  private head: KeyValueNode<T> | null;

  constructor() {}
  add(value: [string, T]) {
    let curr: KeyValueNode<T> | null = this.head;
    while (curr) {
      if (curr.value[0] === value[0]) {
        curr.value = value;
        return;
      }
      curr = curr.next;
    }

    this.head = {
      value,
      next: this.head,
    };
  }

  get(key: string) {
    let curr: KeyValueNode<T> | null = this.head;
    while (curr) {
      if (curr.value[0] === key) {
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
      if (curr.value[0] === key) {
        if (prev) {
          prev.next = curr.next;
        } else {
          this.head = null;
        }
        return curr;
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

// I copy an hash function from the internet because I did not find any sync one in the std lib
function fnv1a(str: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  // Convert to 32-bit unsigned int
  return hash >>> 0;
}

class HashMap<T> {
  private buckets: KeyValueLinkedList<T>[];
  constructor(bucketsLength = 6) {
    this.buckets = Array(bucketsLength)
      .fill(null)
      .map(() => new KeyValueLinkedList());
  }

  put(key: string, value: T) {
    this.buckets[fnv1a(key) % this.buckets.length].add([key, value]);
  }

  get(key: string): T | null {
    const bucket = this.buckets[fnv1a(key) % this.buckets.length];

    return bucket.get(key)?.[1] ?? null;
  }

  remove(key: string) {
    const bucket = this.buckets[fnv1a(key) % this.buckets.length];
    bucket.remove(key);
  }
}
