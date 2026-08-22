import type { APIRoute } from 'astro';
import { getAllTools } from '../data/tools';

export const GET: APIRoute = async ({ site, url }) => {
  const baseUrl = site ? site.toString().replace(/\/$/, '') : url.origin;
  const tools = getAllTools();
  const currentDate = new Date().toISOString().split('T')[0];

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
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
${toolEntries}
</urlset>`;

  return new Response(sitemapXml.trim(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
