export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  INVALID_TIMESTAMP: "Invalid timestamp format",
  INVALID_PAGE: "Invalid page identifier",
  PAGE_INCREMENT_FAILED: "Failed to increment page views",
  BATCH_INCREMENT_FAILED: "Failed to increment multiple pages",
  INTERNAL_SERVER_ERROR: "Internal server error",
} as const;
