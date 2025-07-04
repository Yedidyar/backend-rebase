export const config = {
  BLOBS_DIR: "storage",
  METADATA_DIR: "metadata",
  MAX_LENGTH: 10 * 1024 * 1024,
  MAX_DISK_QUOTA: 1024 * 1024 * 1024,
  MAX_HEADER_LENGTH: 100,
  MAX_HEADER_COUNT: 20,
  MAX_ID_LENGTH: 200,
  MAX_BLOBS_IN_FOLDER: 1,
  NODE_NAME: process.env.NODE_NAME,
  LOAD_BALANCER_ADDRESS: process.env.LOAD_BALANCER_ADDRESS,
  PORT: parseInt(process.env.PORT!),
} as const;
