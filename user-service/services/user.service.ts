export class UserService {
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
