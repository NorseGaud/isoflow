import { MARKDOWN_EMPTY_VALUE } from 'src/config';

export const isMarkdownEmpty = (
  description?: string | null
): boolean => {
  if (!description) {
    return true;
  }

  if (description === MARKDOWN_EMPTY_VALUE) {
    return true;
  }

  const text = description
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();

  return text.length === 0;
};
