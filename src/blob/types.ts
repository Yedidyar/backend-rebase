import type { FastifyRequest } from "fastify";

export interface BlobParams {
  id: string;
}

export interface BlobHeaders {
  "content-type": string;
  [key: string]: string | string[] | undefined;
}

export interface BlobMetadata {
  headers: BlobHeaders;
}

export type BlobRequest = FastifyRequest<{
  Params: BlobParams;
}>;
