import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL('https://mc.yandex.ru/**')],
  },
};

export default nextConfig;
