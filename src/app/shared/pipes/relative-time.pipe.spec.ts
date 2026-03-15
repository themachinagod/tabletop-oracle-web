import { RelativeTimePipe } from './relative-time.pipe';

describe('RelativeTimePipe', () => {
  let pipe: RelativeTimePipe;

  beforeEach(() => {
    pipe = new RelativeTimePipe();
  });

  it('transform_Null_ReturnsEmptyString', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('transform_Undefined_ReturnsEmptyString', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('transform_InvalidDate_ReturnsRawValue', () => {
    expect(pipe.transform('not-a-date')).toBe('not-a-date');
  });

  it('transform_JustNow_ReturnsJustNow', () => {
    const now = new Date().toISOString();
    expect(pipe.transform(now)).toBe('just now');
  });

  it('transform_30SecondsAgo_ReturnsJustNow', () => {
    const date = new Date(Date.now() - 30 * 1000).toISOString();
    expect(pipe.transform(date)).toBe('just now');
  });

  it('transform_1MinuteAgo_Returns1MinuteAgo', () => {
    const date = new Date(Date.now() - 60 * 1000).toISOString();
    expect(pipe.transform(date)).toBe('1 minute ago');
  });

  it('transform_5MinutesAgo_Returns5MinutesAgo', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(pipe.transform(date)).toBe('5 minutes ago');
  });

  it('transform_1HourAgo_Returns1HourAgo', () => {
    const date = new Date(Date.now() - 3600 * 1000).toISOString();
    expect(pipe.transform(date)).toBe('1 hour ago');
  });

  it('transform_2HoursAgo_Returns2HoursAgo', () => {
    const date = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    expect(pipe.transform(date)).toBe('2 hours ago');
  });

  it('transform_1DayAgo_Returns1DayAgo', () => {
    const date = new Date(Date.now() - 86400 * 1000).toISOString();
    expect(pipe.transform(date)).toBe('1 day ago');
  });

  it('transform_3DaysAgo_Returns3DaysAgo', () => {
    const date = new Date(Date.now() - 3 * 86400 * 1000).toISOString();
    expect(pipe.transform(date)).toBe('3 days ago');
  });

  it('transform_1WeekAgo_Returns1WeekAgo', () => {
    const date = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
    expect(pipe.transform(date)).toBe('1 week ago');
  });

  it('transform_1MonthAgo_Returns1MonthAgo', () => {
    const date = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
    expect(pipe.transform(date)).toBe('1 month ago');
  });

  it('transform_1YearAgo_Returns1YearAgo', () => {
    const date = new Date(Date.now() - 365 * 86400 * 1000).toISOString();
    expect(pipe.transform(date)).toBe('1 year ago');
  });

  it('transform_2YearsAgo_Returns2YearsAgo', () => {
    const date = new Date(Date.now() - 2 * 365 * 86400 * 1000).toISOString();
    expect(pipe.transform(date)).toBe('2 years ago');
  });
});
