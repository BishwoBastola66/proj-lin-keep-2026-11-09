import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: [
          // Primary Search Engine Crawlers
          'Googlebot',
          'Google-Extended',
          'Bingbot',
          'Applebot',
          'Applebot-Extended',
          'DuckDuckBot',
          'Slurp',
          'Baiduspider',
          'YandexBot',
          // Modern AI Crawlers & Answer Engines
          'GPTBot',
          'ChatGPT-User',
          'OAI-SearchBot',
          'PerplexityBot',
          'Perplexity-User',
          'ClaudeBot',
          'Claude-Web',
          'anthropic-ai',
          'cohere-ai',
          // Social Media Sharing Crawlers
          'facebookexternalhit',
          'LinkedInBot',
          'Twitterbot',
          'Slackbot',
          'TelegramBot',
          'WhatsApp',
        ],
        allow: '/',
      },
    ],
    sitemap: 'https://www.gyanavsolutions.com/sitemap.xml',
    host: 'https://www.gyanavsolutions.com',
  };
}
