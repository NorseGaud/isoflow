import { MARKDOWN_EMPTY_VALUE } from 'src/config';
import { isMarkdownEmpty } from '../isMarkdownEmpty';

describe('isMarkdownEmpty', () => {
  test('treats undefined, null, and blank strings as empty', () => {
    expect(isMarkdownEmpty(undefined)).toBe(true);
    expect(isMarkdownEmpty(null)).toBe(true);
    expect(isMarkdownEmpty('')).toBe(true);
    expect(isMarkdownEmpty('   ')).toBe(true);
  });

  test('treats Quill empty sentinel and empty HTML as empty', () => {
    expect(isMarkdownEmpty(MARKDOWN_EMPTY_VALUE)).toBe(true);
    expect(isMarkdownEmpty('<p></p>')).toBe(true);
    expect(isMarkdownEmpty('<p><br></p><p><br></p>')).toBe(true);
    expect(isMarkdownEmpty('<p>&nbsp;</p>')).toBe(true);
  });

  test('treats real text as not empty', () => {
    expect(isMarkdownEmpty('<p>Hello</p>')).toBe(false);
    expect(isMarkdownEmpty('<p><strong>Hi</strong></p>')).toBe(false);
  });
});
