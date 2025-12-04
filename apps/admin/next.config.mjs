const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'source.unsplash.com'
      }
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

