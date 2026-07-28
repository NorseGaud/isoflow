/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { MarkdownEditor } from '../MarkdownEditor';

jest.mock('react-quill-new', () => {
  return {
    __esModule: true,
    default: () => {
      return (
        <div className="ql-container ql-snow">
          <div className="ql-editor">Hello</div>
        </div>
      );
    }
  };
});

describe('MarkdownEditor readOnly sizing', () => {
  test('does not stretch quill container to a fixed height when readOnly', () => {
    render(<MarkdownEditor value="<p>Hello</p>" readOnly />);

    const styleText = Array.from(document.styleSheets)
      .flatMap((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((rule) => {
            return rule.cssText;
          });
        } catch {
          return [];
        }
      })
      .join('\n');

    expect(styleText).toMatch(/\.ql-container\.ql-snow[^}]*height:\s*auto/);
    expect(styleText).toMatch(/\.ql-editor[^}]*height:\s*auto/);
  });
});
