export class DateUtils {
  /**
   * Formats a date to a specified format
   */
  static format(date: Date | string | number, format: string = 'yyyy-MM-dd'): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const formatMap: { [key: string]: string } = {
      'yyyy': d.getFullYear().toString(),
      'MM': (d.getMonth() + 1).toString().padStart(2, '0'),
      'dd': d.getDate().toString().padStart(2, '0'),
      'HH': d.getHours().toString().padStart(2, '0'),
      'mm': d.getMinutes().toString().padStart(2, '0'),
      'ss': d.getSeconds().toString().padStart(2, '0')
    };

    return format.replace(/yyyy|MM|dd|HH|mm|ss/g, match => formatMap[match]);
  }

  /**
   * Returns a relative time string (e.g., "2 hours ago", "3 days ago")
   */
  static timeAgo(date: Date | string | number): string {
    const now = new Date();
    const target = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Returns a human-readable duration
   */
  static duration(start: Date | string | number, end: Date | string | number): string {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffInMs = Math.abs(endTime.getTime() - startTime.getTime());

    const seconds = Math.floor(diffInMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Checks if a date is today
   */
  static isToday(date: Date | string | number): boolean {
    const d = new Date(date);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  }

  /**
   * Checks if a date is yesterday
   */
  static isYesterday(date: Date | string | number): boolean {
    const d = new Date(date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return d.getDate() === yesterday.getDate() &&
           d.getMonth() === yesterday.getMonth() &&
           d.getFullYear() === yesterday.getFullYear();
  }

  /**
   * Checks if a date is within a range
   */
  static isInRange(date: Date | string | number, start: Date | string | number, end: Date | string | number): boolean {
    const target = new Date(date);
    const startDate = new Date(start);
    const endDate = new Date(end);
    return target >= startDate && target <= endDate;
  }

  /**
   * Adds days to a date
   */
  static addDays(date: Date | string | number, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  /**
   * Subtracts days from a date
   */
  static subtractDays(date: Date | string | number, days: number): Date {
    return this.addDays(date, -days);
  }

  /**
   * Gets the start of day
   */
  static startOfDay(date: Date | string | number): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Gets the end of day
   */
  static endOfDay(date: Date | string | number): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * Gets the start of week
   */
  static startOfWeek(date: Date | string | number, weekStartsOn: 0 | 1 = 0): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (weekStartsOn === 0 ? 0 : 1);
    return this.startOfDay(new Date(d.setDate(diff)));
  }

  /**
   * Gets the end of week
   */
  static endOfWeek(date: Date | string | number, weekStartsOn: 0 | 1 = 0): Date {
    return this.addDays(this.startOfWeek(date, weekStartsOn), 6);
  }

  /**
   * Gets the start of month
   */
  static startOfMonth(date: Date | string | number): Date {
    const d = new Date(date);
    d.setDate(1);
    return this.startOfDay(d);
  }

  /**
   * Gets the end of month
   */
  static endOfMonth(date: Date | string | number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1, 0);
    return this.endOfDay(d);
  }

  /**
   * Gets the start of year
   */
  static startOfYear(date: Date | string | number): Date {
    const d = new Date(date);
    d.setMonth(0, 1);
    return this.startOfDay(d);
  }

  /**
   * Gets the end of year
   */
  static endOfYear(date: Date | string | number): Date {
    const d = new Date(date);
    d.setMonth(11, 31);
    return this.endOfDay(d);
  }

  /**
   * Calculates the difference in days between two dates
   */
  static daysBetween(start: Date | string | number, end: Date | string | number): number {
    const startDate = this.startOfDay(start);
    const endDate = this.startOfDay(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculates the difference in months between two dates
   */
  static monthsBetween(start: Date | string | number, end: Date | string | number): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                       (endDate.getMonth() - startDate.getMonth());
    return Math.abs(diffMonths);
  }

  /**
   * Calculates the difference in years between two dates
   */
  static yearsBetween(start: Date | string | number, end: Date | string | number): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.abs(endDate.getFullYear() - startDate.getFullYear());
  }

  /**
   * Gets business days between two dates (excluding weekends)
   */
  static businessDaysBetween(start: Date | string | number, end: Date | string | number): number {
    const startDate = this.startOfDay(start);
    const endDate = this.startOfDay(end);
    let businessDays = 0;
    
    const current = new Date(startDate);
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        businessDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return businessDays;
  }

  /**
   * Checks if a date is a weekend
   */
  static isWeekend(date: Date | string | number): boolean {
    const day = new Date(date).getDay();
    return day === 0 || day === 6;
  }

  /**
   * Checks if a date is a business day (Monday-Friday)
   */
  static isBusinessDay(date: Date | string | number): boolean {
    return !this.isWeekend(date);
  }

  /**
   * Gets the next business day
   */
  static nextBusinessDay(date: Date | string | number): Date {
    let d = new Date(date);
    do {
      d = this.addDays(d, 1);
    } while (this.isWeekend(d));
    return d;
  }

  /**
   * Gets the previous business day
   */
  static previousBusinessDay(date: Date | string | number): Date {
    let d = new Date(date);
    do {
      d = this.subtractDays(d, 1);
    } while (this.isWeekend(d));
    return d;
  }

  /**
   * Parses a date string in various formats
   */
  static parseDate(input: string | number | Date): Date | null {
    if (input instanceof Date) {
      return isNaN(input.getTime()) ? null : input;
    }
    
    if (typeof input === 'number') {
      const date = new Date(input);
      return isNaN(date.getTime()) ? null : date;
    }
    
    if (typeof input === 'string') {
      // Try parsing common date formats
      const formats = [
        /^(\d{4})-(\d{2})-(\d{2})$/, // yyyy-mm-dd
        /^(\d{2})\/(\d{2})\/(\d{4})$/, // mm/dd/yyyy
        /^(\d{2})-(\d{2})-(\d{4})$/, // mm-dd-yyyy
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // m/d/yyyy
      ];
      
      for (const format of formats) {
        const match = input.match(format);
        if (match) {
          const [, a, b, c] = match;
          let day, month, year;
          
          if (format.source.includes('yyyy')) {
            if (input.includes('-') && input.indexOf('-') === 4) {
              year = a; month = b; day = c;
            } else {
              year = c; month = a; day = b;
            }
          } else {
            year = c; month = a; day = b;
          }
          
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return isNaN(date.getTime()) ? null : date;
        }
      }
      
      // Fallback to standard Date parsing
      const parsed = new Date(input);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    return null;
  }

  /**
   * Converts date to ISO string
   */
  static toISOString(date: Date | string | number): string {
    const d = new Date(date);
    return d.toISOString();
  }

  /**
   * Gets timezone offset in hours
   */
  static getTimezoneOffset(date: Date | string | number = new Date()): number {
    return new Date(date).getTimezoneOffset() / 60;
  }

  /**
   * Checks if a date is valid
   */
  static isValid(date: Date | string | number): boolean {
    const d = new Date(date);
    return !isNaN(d.getTime());
  }
}