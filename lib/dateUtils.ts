/**
 * Date utility functions for handling date conversions
 * Handles both string and Date types safely
 */

/**
 * Safely converts a date value (string or Date) to a Date object
 */
export function toDate(date: string | Date | undefined | null): Date | null {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (typeof date === 'string') {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/**
 * Formats a date value (string or Date) to a formatted string
 */
export function formatDate(
  date: string | Date | undefined | null,
  formatStr: string = 'MMM dd, yyyy'
): string {
  const dateObj = toDate(date);
  if (!dateObj) return 'N/A';
  
  // Simple formatting - for more complex needs, use date-fns format
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  if (formatStr === 'MMMM dd, yyyy') {
    return `${monthNames[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
  }
  if (formatStr === 'MMM dd, yyyy') {
    return `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
  }
  
  // Fallback to ISO string
  return dateObj.toISOString().split('T')[0];
}

