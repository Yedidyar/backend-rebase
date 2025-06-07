import type { RegisteredNode } from "../../types.ts";

export class NodeRegistrationService {
  static async getAll(): Promise<RegisteredNode[]> {
    return [];
  }
  static async addNode(node: RegisteredNode) {}
}
