import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.WEBHOOK_BASE_URL || env.VITE_SITE_URL || '').replace(/\/$/, '')

  return {
    plugins: [
      react(),
      {
        name: 'html-site-meta',
        transformIndexHtml(html) {
          return html
            .replaceAll('%SITE_URL%', siteUrl)
            .replace(
              '%OG_IMAGE%',
              siteUrl ? `${siteUrl}/matheus-melissa.jpg` : '/matheus-melissa.jpg',
            )
        },
      },
    ],
  }
})
