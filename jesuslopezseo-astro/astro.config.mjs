import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
    site: 'https://www.jesuslopezseo.com',
    trailingSlash: 'always',
    output: 'server',
    adapter: vercel(),
});
