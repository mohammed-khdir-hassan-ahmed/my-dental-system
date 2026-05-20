import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'My Dental System',
    short_name: 'Dental',
    description: 'Dental management system',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#0ea5e9',
    icons: [
      {
        src: '/icon/tooth.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon/tooth.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
