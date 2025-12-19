const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'source.unsplash.com'
      },
      // Cloudflare R2 - permite qualquer subdomínio do R2
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com'
      },
      // Cloudflare R2 - Public Development URL (pub-*.r2.dev)
      {
        protocol: 'https',
        hostname: '*.r2.dev'
      },
      // Cloudflare R2 - formato alternativo (se usar domínio customizado)
      ...(process.env.NEXT_PUBLIC_R2_PUBLIC_URL
        ? [
            {
              protocol: 'https',
              hostname: new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL).hostname
            }
          ]
        : [])
    ],
    // Permitir data URLs para preview de imagens locais
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },
  // Configuração vazia do Turbopack para evitar erro
  turbopack: {}
}

export default nextConfig

