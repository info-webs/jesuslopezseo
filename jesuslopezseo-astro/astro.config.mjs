import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
    site: 'https://www.jesuslopezseo.com',
    trailingSlash: 'never',
    output: 'server',
    adapter: vercel(),
});
