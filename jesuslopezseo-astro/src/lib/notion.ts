/**
 * Notion API client for JesusLopezSEO blog
 * Database ID: 819b3c45-d080-497b-915c-72ec68ccf633
 *
 * Requires environment variables:
 *   NOTION_TOKEN        — your Notion integration token
 *   NOTION_DATABASE_ID  — the blog posts database ID
 */

const NOTION_TOKEN = process.env.NOTION_TOKEN ?? import.meta.env.NOTION_TOKEN;
const NOTION_DATABASE_ID =
  process.env.NOTION_DATABASE_ID ?? import.meta.env.NOTION_DATABASE_ID ?? '819b3c45-d080-497b-915c-72ec68ccf633';

const BASE_URL = 'https://api.notion.com/v1';

const headers = {
  Authorization: `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

// ── Types ──────────────────────────────────────────────────────────────────

export interface NotionPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  publishedDate: string | null;
  status: string;
  featured: boolean;
  wordCount: number;
  originalUrl: string;
  url: string; // Notion page URL
}

// ── Helpers ────────────────────────────────────────────────────────────────

function extractTitle(prop: any): string {
  return prop?.title?.[0]?.plain_text ?? '';
}

function extractRichText(prop: any): string {
  return prop?.rich_text?.[0]?.plain_text ?? '';
}

function extractSelect(prop: any): string {
  return prop?.select?.name ?? '';
}

function extractMultiSelect(prop: any): string[] {
  // Tags are stored as JSON array string in rich_text
  const raw = prop?.rich_text?.[0]?.plain_text ?? '[]';
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function extractDate(prop: any): string | null {
  return prop?.date?.start ?? null;
}

function extractCheckbox(prop: any): boolean {
  return prop?.checkbox ?? false;
}

function extractNumber(prop: any): number {
  return prop?.number ?? 0;
}

function extractUrl(prop: any): string {
  return prop?.url ?? '';
}

function mapPage(page: any): NotionPost {
  const p = page.properties;
  return {
    id: page.id,
    title: extractTitle(p['Title']),
    slug: extractRichText(p['Slug']),
    excerpt: extractRichText(p['Excerpt']),
    category: extractSelect(p['Category']),
    tags: extractMultiSelect(p['Tags']),
    author: extractRichText(p['Author']),
    publishedDate: extractDate(p['Published Date']),
    status: extractSelect(p['Status']),
    featured: extractCheckbox(p['Featured']),
    wordCount: extractNumber(p['Word Count']),
    originalUrl: extractUrl(p['Original URL']),
    url: page.url,
  };
}

// ── API calls ──────────────────────────────────────────────────────────────

/**
 * Fetch all published posts, sorted by date desc.
 * Pass `category` to filter by category.
 */
export async function getPosts(options?: {
  category?: string;
  limit?: number;
  cursor?: string;
}): Promise<{ posts: NotionPost[]; nextCursor: string | null; hasMore: boolean }> {
  const filter: any = {
    and: [
      {
        property: 'Status',
        select: { equals: 'Published' },
      },
    ],
  };

  if (options?.category) {
    filter.and.push({
      property: 'Category',
      select: { equals: options.category },
    });
  }

  const body: any = {
    filter,
    sorts: [{ property: 'Published Date', direction: 'descending' }],
    page_size: options?.limit ?? 12,
  };

  if (options?.cursor) {
    body.start_cursor = options.cursor;
  }

  const res = await fetch(`${BASE_URL}/databases/${NOTION_DATABASE_ID}/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Notion API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();

  return {
    posts: data.results.map(mapPage),
    nextCursor: data.next_cursor ?? null,
    hasMore: data.has_more ?? false,
  };
}

/**
 * Fetch a single post by slug.
 */
export async function getPostBySlug(slug: string): Promise<NotionPost | null> {
  const body = {
    filter: {
      and: [
        {
          property: 'Slug',
          rich_text: { equals: slug },
        },
        {
          property: 'Status',
          select: { equals: 'Published' },
        },
      ],
    },
    page_size: 1,
  };

  const res = await fetch(`${BASE_URL}/databases/${NOTION_DATABASE_ID}/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Notion API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  if (!data.results?.length) return null;

  return mapPage(data.results[0]);
}

/**
 * Fetch the full content blocks of a page.
 * Returns blocks as a simple HTML string for rendering.
 */
export async function getPageContent(pageId: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/blocks/${pageId}/children?page_size=100`, {
    headers,
  });

  if (!res.ok) {
    return '';
  }

  const data = await res.json();
  return blocksToHtml(data.results ?? []);
}

/**
 * Get all slugs for static path generation.
 */
export async function getAllSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let cursor: string | undefined;

  while (true) {
    const body: any = {
      filter: {
        property: 'Status',
        select: { equals: 'Published' },
      },
      page_size: 100,
    };
    if (cursor) body.start_cursor = cursor;

    const res = await fetch(`${BASE_URL}/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) break;

    const data = await res.json();
    for (const page of data.results) {
      const slug = page.properties?.['Slug']?.rich_text?.[0]?.plain_text;
      if (slug) slugs.push(slug);
    }

    if (!data.has_more) break;
    cursor = data.next_cursor;
  }

  return slugs;
}

/**
 * Get featured posts (Featured checkbox = true).
 */
export async function getFeaturedPosts(limit = 3): Promise<NotionPost[]> {
  const body = {
    filter: {
      and: [
        { property: 'Status', select: { equals: 'Published' } },
        { property: 'Featured', checkbox: { equals: true } },
      ],
    },
    sorts: [{ property: 'Published Date', direction: 'descending' }],
    page_size: limit,
  };

  const res = await fetch(`${BASE_URL}/databases/${NOTION_DATABASE_ID}/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.results.map(mapPage);
}

// ── Blocks → HTML ─────────────────────────────────────────────────────────

function richTextToHtml(richText: any[]): string {
  if (!richText?.length) return '';
  return richText
    .map((r) => {
      let text = r.plain_text ?? '';
      if (r.annotations?.bold) text = `<strong>${text}</strong>`;
      if (r.annotations?.italic) text = `<em>${text}</em>`;
      if (r.annotations?.code) text = `<code>${text}</code>`;
      if (r.annotations?.strikethrough) text = `<s>${text}</s>`;
      if (r.href) text = `<a href="${r.href}" target="_blank" rel="noopener">${text}</a>`;
      return text;
    })
    .join('');
}

function blocksToHtml(blocks: any[]): string {
  let html = '';
  let listBuffer: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (!listBuffer.length) return;
    const tag = listType === 'ol' ? 'ol' : 'ul';
    html += `<${tag}>${listBuffer.join('')}</${tag}>`;
    listBuffer = [];
    listType = null;
  };

  for (const block of blocks) {
    const type = block.type;
    const content = block[type];

    if (type !== 'bulleted_list_item' && type !== 'numbered_list_item') {
      flushList();
    }

    switch (type) {
      case 'heading_1':
        html += `<h2>${richTextToHtml(content.rich_text)}</h2>`;
        break;
      case 'heading_2':
        html += `<h3>${richTextToHtml(content.rich_text)}</h3>`;
        break;
      case 'heading_3':
        html += `<h4>${richTextToHtml(content.rich_text)}</h4>`;
        break;
      case 'paragraph':
        const text = richTextToHtml(content.rich_text);
        if (text) html += `<p>${text}</p>`;
        break;
      case 'bulleted_list_item':
        if (listType !== 'ul') { flushList(); listType = 'ul'; }
        listBuffer.push(`<li>${richTextToHtml(content.rich_text)}</li>`);
        break;
      case 'numbered_list_item':
        if (listType !== 'ol') { flushList(); listType = 'ol'; }
        listBuffer.push(`<li>${richTextToHtml(content.rich_text)}</li>`);
        break;
      case 'quote':
        html += `<blockquote>${richTextToHtml(content.rich_text)}</blockquote>`;
        break;
      case 'code':
        html += `<pre><code>${richTextToHtml(content.rich_text)}</code></pre>`;
        break;
      case 'divider':
        html += '<hr/>';
        break;
      case 'image':
        const imgUrl = content.type === 'external' ? content.external.url : content.file?.url;
        const caption = content.caption?.length ? richTextToHtml(content.caption) : '';
        if (imgUrl) {
          html += `<figure><img src="${imgUrl}" alt="${caption}" loading="lazy"/>${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
        }
        break;
      default:
        break;
    }
  }

  flushList();
  return html;
}
