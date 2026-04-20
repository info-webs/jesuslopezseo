import type { APIRoute } from 'astro';
import { getPosts } from '../lib/notion';

const BASE = 'https://www.jesuslopezseo.com';

// Static pages with their priorities and change frequencies
const staticPages = [
  { url: '/',                                            priority: '1.0', changefreq: 'weekly'  },
  { url: '/posicionamiento-web',                         priority: '0.9', changefreq: 'monthly' },
  { url: '/servicios/posicionamiento-geo-salamanca',     priority: '0.9', changefreq: 'monthly' },
  { url: '/servicios/diseno-web',                        priority: '0.8', changefreq: 'monthly' },
  { url: '/servicios/community-manager',                 priority: '0.7', changefreq: 'monthly' },
  { url: '/servicios/redaccion-contenido',               priority: '0.7', changefreq: 'monthly' },
  { url: '/servicios/diseno-grafico',                    priority: '0.7', changefreq: 'monthly' },
  { url: '/servicios/posicionamiento-aso',               priority: '0.7', changefreq: 'monthly' },
  { url: '/servicios/hosting-seo',                       priority: '0.7', changefreq: 'monthly' },
  { url: '/noticias',                                        priority: '0.8', changefreq: 'daily'   },
  { url: '/contactar',                                   priority: '0.6', changefreq: 'yearly'  },
  { url: '/pedir-presupuesto',                           priority: '0.6', changefreq: 'yearly'  },
];

export const GET: APIRoute = async () => {
  // Fetch all published blog posts
  let allPosts: Array<{ slug: string; publishedDate: string | null }> = [];
  try {
    let cursor: string | undefined;
    while (true) {
      const result = await getPosts({ limit: 100, cursor });
      allPosts = allPosts.concat(result.posts);
      if (!result.hasMore || !result.nextCursor) break;
      cursor = result.nextCursor;
    }
  } catch (e) {
    console.error('Sitemap: error fetching posts', e);
  }

  const today = new Date().toISOString().split('T')[0];

  const staticUrls = staticPages
    .map(({ url, priority, changefreq }) => `
  <url>
    <loc>${BASE}${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`)
    .join('');

  const blogUrls = allPosts
    .filter(p => p.slug)
    .map(p => {
      const lastmod = p.publishedDate
        ? p.publishedDate.slice(0, 10)
        : today;
      return `
  <url>
    <loc>${BASE}/noticias/${p.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.6</priority>
  </url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${staticUrls}
${blogUrls}
</urlset>`;

  return new Response(xml.trim(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
