import * as cheerio from 'cheerio';

export class HtmlParser {
  static parse(html: string) {
    return cheerio.load(html);
  }

  static extractTitle(html: string): string {
    const $ = this.parse(html);
    return $('title').text().trim();
  }
  
  // Example specific extractor
  static extractLinks(html: string, baseUrl: string): string[] {
    const $ = this.parse(html);
    const links: string[] = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        // Resolve relative URLs
        try {
            const absolute = new URL(href, baseUrl).href;
            links.push(absolute);
        } catch (e) { /* ignore invalid urls */ }
      }
    });
    return links;
  }
}