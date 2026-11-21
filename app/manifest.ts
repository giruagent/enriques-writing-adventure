import type { MetadataRoute } from 'next';
export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return {
    name: 'Enrique’s Writing Adventure', short_name: 'Enrique',
    description: 'A little world for a big writing adventure.',
    start_url: `${base}/`, scope: `${base}/`, display: 'standalone',
    background_color: '#d8f3ed', theme_color: '#58c4c0',
    icons: [192, 512].map(size => ({src: `${base}/icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png'})),
  };
}
