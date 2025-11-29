"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramScraper = void 0;
const baseScraper_1 = require("./baseScraper");
const logger_1 = require("../utils/logger");
class TelegramScraper extends baseScraper_1.BaseScraper {
    constructor(proxyService) {
        super(proxyService);
    }
    async scrape(options) {
        if (!this.page)
            throw new Error("Browser Page not initialized");
        // 1. Wait for the main content to load
        try {
            await this.page.waitForSelector('.tgme_page', { timeout: 10000 });
        }
        catch (e) {
            logger_1.logger.warn("Telegram page header not found, might be a private channel or invalid URL.");
        }
        // 2. Wait for dynamic content (posts) to load
        await this.randomDelay(2000);
        // 3. Extract Channel/Group Metadata
        const metadata = await this.extractMetadata(this.page);
        // 4. Extract Posts
        const posts = await this.extractPosts(this.page);
        // 5. Extract Contact Information
        const contactInfo = await this.extractContactInfo(this.page);
        // 6. Construct Result
        const title = metadata.name || await this.page.title();
        const description = metadata.description || '';
        // Combine posts into content text
        const content = `
Channel/Group: ${metadata.name}
${metadata.isVerified ? '✓ Verified' : ''}
${metadata.subscribers ? `Subscribers: ${metadata.subscribers}` : ''}

Description: ${metadata.description}

Recent Posts:
${posts.map((p, idx) => `
[${idx + 1}] ${p.timestamp ? `(${p.timestamp})` : ''}
${p.text}
Views: ${p.views || 'N/A'}
${p.mediaUrl ? `Media: ${p.mediaUrl}` : ''}
`).join('\n---\n')}
        `.trim();
        // Extract links from posts
        const links = posts
            .filter(p => p.mediaUrl || p.links.length > 0)
            .flatMap(p => [
            ...(p.mediaUrl ? [{ text: 'Post Media', href: p.mediaUrl }] : []),
            ...p.links.map(link => ({ text: link.text || 'Link', href: link.url }))
        ]);
        // Add channel link
        if (metadata.channelLink) {
            links.unshift({ text: `Telegram Channel: ${metadata.name}`, href: metadata.channelLink });
        }
        return {
            title,
            description,
            h1: metadata.name,
            content,
            links,
            leads: {
                emails: contactInfo.emails,
                phones: contactInfo.phones,
                socialLinks: contactInfo.socialLinks
            },
            images: posts.filter(p => p.imageUrl).map(p => ({
                src: p.imageUrl,
                alt: 'Telegram post image'
            })),
            videos: posts.filter(p => p.videoUrl).map(p => ({
                url: p.videoUrl,
                type: 'other'
            })),
            jsonLd: []
        };
    }
    async extractMetadata(page) {
        return page.evaluate(() => {
            const metadata = {
                name: '',
                description: '',
                subscribers: '',
                isVerified: false,
                channelLink: ''
            };
            // Channel/Group name
            const nameEl = document.querySelector('.tgme_page_title span');
            if (nameEl) {
                metadata.name = nameEl.textContent?.trim() || '';
            }
            // Verified badge
            const verifiedEl = document.querySelector('.tgme_page_title .verified-icon');
            metadata.isVerified = !!verifiedEl;
            // Description
            const descEl = document.querySelector('.tgme_page_description');
            if (descEl) {
                metadata.description = descEl.textContent?.trim() || '';
            }
            // Subscriber count
            const subscribersEl = document.querySelector('.tgme_page_extra');
            if (subscribersEl) {
                metadata.subscribers = subscribersEl.textContent?.trim() || '';
            }
            // Channel link (for opening in Telegram app)
            const channelLinkEl = document.querySelector('.tgme_page_photo_image');
            if (channelLinkEl) {
                const parentLink = channelLinkEl.closest('a');
                if (parentLink) {
                    metadata.channelLink = parentLink.getAttribute('href') || '';
                }
            }
            return metadata;
        });
    }
    async extractPosts(page) {
        return page.evaluate(() => {
            const posts = [];
            const postElements = document.querySelectorAll('.tgme_widget_message');
            postElements.forEach((postEl) => {
                const post = {
                    text: '',
                    timestamp: null,
                    views: null,
                    mediaUrl: null,
                    imageUrl: null,
                    videoUrl: null,
                    links: []
                };
                // Post text
                const textEl = postEl.querySelector('.tgme_widget_message_text');
                if (textEl) {
                    post.text = textEl.textContent?.trim() || '';
                }
                // Timestamp
                const timeEl = postEl.querySelector('.tgme_widget_message_date time');
                if (timeEl) {
                    post.timestamp = timeEl.getAttribute('datetime') || timeEl.textContent?.trim() || null;
                }
                // View count
                const viewsEl = postEl.querySelector('.tgme_widget_message_views');
                if (viewsEl) {
                    post.views = viewsEl.textContent?.trim() || null;
                }
                // Media (images, videos)
                const photoLink = postEl.querySelector('.tgme_widget_message_photo_wrap');
                if (photoLink) {
                    const bgStyle = photoLink.style.backgroundImage;
                    if (bgStyle) {
                        const urlMatch = bgStyle.match(/url\(['"]?([^'"]+)['"]?\)/);
                        if (urlMatch) {
                            post.imageUrl = urlMatch[1];
                            post.mediaUrl = urlMatch[1];
                        }
                    }
                }
                const videoEl = postEl.querySelector('.tgme_widget_message_video_wrap video');
                if (videoEl) {
                    const videoSrc = videoEl.getAttribute('src');
                    if (videoSrc) {
                        post.videoUrl = videoSrc;
                        post.mediaUrl = videoSrc;
                    }
                }
                // Extract links from post text
                const linkElements = postEl.querySelectorAll('.tgme_widget_message_text a');
                linkElements.forEach((linkEl) => {
                    const url = linkEl.getAttribute('href');
                    const text = linkEl.textContent?.trim() || '';
                    if (url) {
                        post.links.push({ text, url });
                    }
                });
                // Only add posts that have content
                if (post.text || post.mediaUrl) {
                    posts.push(post);
                }
            });
            return posts;
        });
    }
    async extractContactInfo(page) {
        return page.evaluate(() => {
            const contactInfo = {
                emails: [],
                phones: [],
                socialLinks: []
            };
            // Get all text content
            const bodyText = document.body.textContent || '';
            // Extract emails using regex
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g;
            const emailMatches = bodyText.match(emailRegex);
            if (emailMatches) {
                contactInfo.emails = [...new Set(emailMatches)].map(e => e.toLowerCase());
            }
            // Extract phones using regex
            const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g;
            const phoneMatches = bodyText.match(phoneRegex);
            if (phoneMatches) {
                contactInfo.phones = [...new Set(phoneMatches)];
            }
            // Extract social media links
            const socialDomains = [
                'facebook.com', 'fb.com',
                'instagram.com',
                'twitter.com', 'x.com',
                'linkedin.com',
                'youtube.com',
                'tiktok.com'
            ];
            const allLinks = document.querySelectorAll('a[href]');
            allLinks.forEach((link) => {
                const href = link.getAttribute('href');
                if (href) {
                    const isSocial = socialDomains.some(domain => href.includes(domain));
                    if (isSocial && !contactInfo.socialLinks.includes(href)) {
                        contactInfo.socialLinks.push(href);
                    }
                }
            });
            return contactInfo;
        });
    }
}
exports.TelegramScraper = TelegramScraper;
