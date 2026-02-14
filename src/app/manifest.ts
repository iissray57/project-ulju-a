import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ClosetBiz - 옷장 시공 관리',
    short_name: 'ClosetBiz',
    description: '앵글/시스템 옷장 1인 시공업체 업무 관리 시스템',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0F',
    theme_color: '#6366F1',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
