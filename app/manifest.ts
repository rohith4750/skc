import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SKC Caterers - Management System',
    short_name: 'SKC Caterers',
    description: 'SKC Caterers - Established 1989. Manage catering services, customers, orders, and bills',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ea580c',
    icons: [
      {
        src: '/images/logo-dark.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
