import { createHash } from "node:crypto";
import type { RegisteredNode } from "../../types.ts";

export class NodeRegistrationService {
  private static registeredNodes: RegisteredNode[] = [];

  static getAll() {
    return this.registeredNodes;
  }

  static addNode(node: RegisteredNode) {
    this.registeredNodes.push(node);
  }

  static getDownstreamNode(requestId: string) {
    const hash = createHash("md5").update(requestId).digest("hex");

    return this.registeredNodes[
      parseInt(hash, 16) % this.registeredNodes.length
    ]!;
  }
}
