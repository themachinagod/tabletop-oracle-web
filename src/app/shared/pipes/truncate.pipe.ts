import { Pipe, PipeTransform } from '@angular/core';

/**
 * Truncates text at a configurable length with an ellipsis suffix.
 *
 * Returns the original text unchanged if it is shorter than the limit.
 * The suffix (default "...") is included in the character count.
 */
@Pipe({
  name: 'truncate',
  standalone: true,
})
export class TruncatePipe implements PipeTransform {
  /**
   * Truncate a string to a maximum length.
   *
   * @param value - Text to truncate
   * @param limit - Maximum length including suffix (default 100)
   * @param suffix - Suffix appended when truncated (default "...")
   * @returns Truncated string
   */
  transform(value: string | null | undefined, limit = 100, suffix = '...'): string {
    if (!value) {
      return '';
    }

    if (value.length <= limit) {
      return value;
    }

    return value.substring(0, limit - suffix.length) + suffix;
  }
}
