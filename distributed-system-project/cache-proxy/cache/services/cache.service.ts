import { createHash } from "node:crypto";
import type { RegisteredNode } from "../types.ts";
import { readiness } from "../../index.ts";
import { logger } from "../../../logger/index.ts";

// export class CacheError extends Error {
//   constructor(message?: string) {
//     super(message);
//     this.name = "node cache";
//   }
// }

export class CacheService {
  private static registeredNodes: RegisteredNode[] = [];

  static getAll() {
    return this.registeredNodes;
  }

  static addNode(node: RegisteredNode) {
    if (readiness.getIsReady()) {
      // throw new CacheError(
      //   "the request was rejected because cache period is over",
      // );
    }
    this.registeredNodes.push(node);
  }

  static getDownstreamNode(requestId: string) {
    const hash = createHash("md5").update(requestId).digest("hex");

    return this.registeredNodes[
      parseInt(hash, 16) % this.registeredNodes.length
    ]!;
  }
}
