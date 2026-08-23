/**
 * Status Helper Utilities
 * Shared functions for status-related logic
 */

export type StatusType = 'Completed' | 'Processing' | 'Review Needed' | 'Failed';

export type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

/**
 * Get MUI Chip color based on status
 */
export const getStatusColor = (status: StatusType): ChipColor => {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'Processing':
      return 'info';
    case 'Review Needed':
      return 'warning';
    case 'Failed':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Get score color based on value
 */
export const getScoreColor = (score: number): string => {
  if (score > 80) return 'green';
  if (score > 50) return 'orange';
  return 'red';
};

/**
 * Format value with optional suffix
 */
export const formatValue = (val: number | string | null | undefined, suffix: string = ''): string => {
  if (val === null || val === undefined) return '0';
  if (typeof val === 'string') return val;
  if (isNaN(val)) return '0';
  return `${val}${suffix}`;
};
