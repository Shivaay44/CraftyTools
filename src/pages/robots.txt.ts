import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site, url }) => {
  const baseUrl = site ? site.toString().replace(/\/$/, '') : url.origin;

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(robotsTxt.trim(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
