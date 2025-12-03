'use client'

interface HeroProps {
  imageUrl?: string
}

export function Hero({
  imageUrl = ''
}: HeroProps) {
  // Se não houver imagem, não renderizar o componente
  if (!imageUrl) {
    return null
  }

  return (
    <div
      className="relative overflow-hidden w-full"
      style={{
        width: '100vw',
        marginLeft: 'calc(50% - 50vw)',
        marginRight: 'calc(50% - 50vw)',
        maxWidth: '100vw',
        marginTop: '-3rem',
        marginBottom: 0,
        paddingTop: 0,
        paddingBottom: 0,
        position: 'relative',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 0,
        display: 'block',
        lineHeight: 0
      }}
    >
      <>
        <style dangerouslySetInnerHTML={{__html: `
          .hero-mask-mobile {
            -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 80%, rgba(0,0,0,1) 100%);
            mask-image: linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 80%, rgba(0,0,0,1) 100%);
          }
          @media (min-width: 768px) {
            .hero-mask-mobile {
              -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,1) 100%);
              mask-image: linear-gradient(to top, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,1) 100%);
            }
          }
        `}} />
        <img
          src={imageUrl}
          alt="Hero banner"
          className="w-full mt-[45px] h-auto object-contain object-center block hero-mask-mobile"
          style={{
            display: 'block',
            marginTop: '45px !important',
            padding: 0,
            maxHeight: 'none'
          }}
        />
      </>
    </div>
  )
}
