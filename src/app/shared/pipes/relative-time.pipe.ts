import { Pipe, PipeTransform } from '@angular/core';

/** Time interval thresholds in seconds for relative time formatting. */
const INTERVALS: { label: string; seconds: number }[] = [
  { label: 'year', seconds: 31536000 },
  { label: 'month', seconds: 2592000 },
  { label: 'week', seconds: 604800 },
  { label: 'day', seconds: 86400 },
  { label: 'hour', seconds: 3600 },
  { label: 'minute', seconds: 60 },
];

/**
 * Converts an ISO date string to a relative time description.
 *
 * Examples: "2 hours ago", "3 days ago", "just now".
 * Falls back to the raw value if the input cannot be parsed.
 */
@Pipe({
  name: 'relativeTime',
  standalone: true,
})
export class RelativeTimePipe implements PipeTransform {
  /**
   * Transform an ISO date string to relative time.
   *
   * @param value - ISO 8601 date string
   * @returns Relative time string (e.g. "2 hours ago")
   */
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return value;
    }

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) {
      return 'just now';
    }

    for (const interval of INTERVALS) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return count === 1 ? `1 ${interval.label} ago` : `${count} ${interval.label}s ago`;
      }
    }

    return 'just now';
  }
}
