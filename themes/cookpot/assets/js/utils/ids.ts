/**
 * Generates a unique instance ID for a planned meal item.
 * Format: `rec_<timestamp>_<random5chars>`
 */
export function generateInstanceId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}
