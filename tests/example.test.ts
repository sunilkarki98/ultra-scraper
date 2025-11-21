import { HtmlParser } from '../src/parsers/htmlParser';

describe('HtmlParser', () => {
  const sampleHtml = `
    <html>
      <head><title>Test Page</title></head>
      <body>
        <a href="/foo">Foo</a>
        <a href="https://example.com/bar">Bar</a>
      </body>
    </html>
  `;

  it('should extract title', () => {
    const title = HtmlParser.extractTitle(sampleHtml);
    expect(title).toBe('Test Page');
  });

  it('should extract and normalize links', () => {
    const links = HtmlParser.extractLinks(sampleHtml, 'https://base.com');
    expect(links).toContain('https://base.com/foo');
    expect(links).toContain('https://example.com/bar');
  });
});