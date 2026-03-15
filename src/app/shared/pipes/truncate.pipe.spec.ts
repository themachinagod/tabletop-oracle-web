import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  let pipe: TruncatePipe;

  beforeEach(() => {
    pipe = new TruncatePipe();
  });

  it('transform_Null_ReturnsEmptyString', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('transform_Undefined_ReturnsEmptyString', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('transform_EmptyString_ReturnsEmptyString', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('transform_ShortText_ReturnsUnchanged', () => {
    expect(pipe.transform('Hello', 100)).toBe('Hello');
  });

  it('transform_ExactLimit_ReturnsUnchanged', () => {
    const text = 'a'.repeat(100);
    expect(pipe.transform(text, 100)).toBe(text);
  });

  it('transform_OverLimit_TruncatesWithEllipsis', () => {
    const text = 'a'.repeat(110);
    const result = pipe.transform(text, 100);
    expect(result.length).toBe(100);
    expect(result.endsWith('...')).toBe(true);
  });

  it('transform_CustomLimit_RespectsLimit', () => {
    const text = 'Hello, World!';
    const result = pipe.transform(text, 8);
    expect(result).toBe('Hello...');
    expect(result.length).toBe(8);
  });

  it('transform_CustomSuffix_UsesSuffix', () => {
    const text = 'Hello, World!';
    const result = pipe.transform(text, 10, ' >>');
    expect(result).toBe('Hello,  >>');
    expect(result.endsWith(' >>')).toBe(true);
  });

  it('transform_DefaultLimit_Is100', () => {
    const text = 'a'.repeat(105);
    const result = pipe.transform(text);
    expect(result.length).toBe(100);
  });

  it('transform_SingleCharSuffix_CorrectLength', () => {
    const text = 'abcdefghij';
    const result = pipe.transform(text, 5, '~');
    expect(result).toBe('abcd~');
    expect(result.length).toBe(5);
  });
});
