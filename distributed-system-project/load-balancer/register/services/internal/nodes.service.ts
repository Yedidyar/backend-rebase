import type { RegisteredNode } from "../../types.ts";

export class NodeRegistrationService {
  private static registeredNodes: RegisteredNode[] = [];

  static async getAll(): Promise<RegisteredNode[]> {
    return this.registeredNodes;
  }
  static async addNode(node: RegisteredNode) {
    this.registeredNodes.push(node);
  }
}
