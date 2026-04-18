import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const content = `User-agent: *
Allow: /

# Bloquear zonas de admin y utilidades
Disallow: /api/
Disallow: /_astro/

# Sitemap
Sitemap: https://www.jesuslopezseo.com/sitemap.xml
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
