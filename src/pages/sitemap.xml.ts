import type { APIRoute } from 'astro';
import { getAllTools } from '../data/tools';

export const GET: APIRoute = async ({ site, url }) => {
  const baseUrl = site ? site.toString().replace(/\/$/, '') : url.origin;
  const tools = getAllTools();
  const currentDate = new Date().toISOString().split('T')[0];

  const staticPages = [
    { path: '', priority: '1.0', changefreq: 'daily' },
    { path: '/tools', priority: '0.9', changefreq: 'daily' },
    { path: '/workflows', priority: '0.8', changefreq: 'weekly' },
    { path: '/about', priority: '0.6', changefreq: 'monthly' },
    { path: '/contact', priority: '0.6', changefreq: 'monthly' },
    { path: '/privacy', priority: '0.4', changefreq: 'monthly' },
    { path: '/terms', priority: '0.4', changefreq: 'monthly' },
  ];

  const staticEntries = staticPages
    .map((page) => `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`)
    .join('\n');

  const toolEntries = tools
    .map((tool) => {
      const priority = '0.8';
      return `  <url>
    <loc>${baseUrl}/tools/${tool.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join('\n');

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${toolEntries}
</urlset>`;

  return new Response(sitemapXml.trim(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
