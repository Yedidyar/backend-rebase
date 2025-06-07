import type { FastifyRequest } from "fastify";

export interface RegisteredNode {
  destination: {
    host: string;
    port: number;
  };
  name: string;
}

export type RegisteredNodeRequest = FastifyRequest<{
  Body: string;
}>;
