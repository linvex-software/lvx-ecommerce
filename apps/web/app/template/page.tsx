'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function TemplatePage() {
  // O design do Figma usa dimensões muito pequenas (331px), então vamos escalar proporcionalmente
  // Multiplicador: 3x para tornar legível em telas reais
  const scale = 3
  
  return (
    <div className="min-h-screen bg-white" style={{ maxWidth: `${331 * scale}px`, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <header className="w-full" style={{ height: `${51.03 * scale}px` }}>
        <div className="relative" style={{ padding: `${12.87 * scale}px ${18.39 * scale}px` }}>
          {/* Top Left - Country Selector */}
          <div className="absolute" style={{ left: `${18.39 * scale}px`, top: `${12.87 * scale}px` }}>
            <div className="flex items-center" style={{ gap: `${3.22 * scale}px` }}>
              <div className="bg-gray-200 border border-gray-300" style={{ width: `${7.82 * scale}px`, height: `${7.82 * scale}px` }}></div>
              <div className="bg-[#222222]" style={{ width: `${3.45 * scale}px`, height: `${3.45 * scale}px` }}></div>
            </div>
          </div>

          {/* Logo - Centered */}
          <div className="absolute" style={{ left: '50%', top: `${8.28 * scale}px`, transform: 'translateX(-50%)' }}>
            <div className="flex items-center" style={{ gap: `${3.22 * scale}px` }}>
              <div 
                className="border"
                style={{ 
                  width: `${24.6 * scale}px`,
                  height: `${17.01 * scale}px`,
                  borderLeft: `${0.23 * scale}px solid #000000`
                }}
              ></div>
              <h1 
                className="font-bold uppercase text-[#222222]"
                style={{ 
                  fontSize: `${5.52 * scale}px`,
                  letterSpacing: '30%',
                  fontFamily: 'Jura, sans-serif',
                  lineHeight: '1.18em'
                }}
              >
                Cosmic fashion
              </h1>
            </div>
          </div>

          {/* Nav Icons - Top Right */}
          <div className="absolute flex items-center" style={{ right: `${18.39 * scale}px`, top: `${14.25 * scale}px`, gap: `${6.9 * scale}px` }}>
            <div className="bg-[#222222] rounded" style={{ width: `${6.9 * scale}px`, height: `${6.9 * scale}px` }}></div>
            <div className="bg-[#222222] rounded" style={{ width: `${5.06 * scale}px`, height: `${5.06 * scale}px` }}></div>
            <div className="bg-[#222222] rounded relative" style={{ width: `${6.9 * scale}px`, height: `${6.9 * scale}px` }}>
              <span 
                className="absolute bg-[#222222] rounded-full border border-white text-white flex items-center justify-center"
                style={{ 
                  top: '-4px',
                  right: '-4px',
                  width: `${3.68 * scale}px`, 
                  height: `${3.68 * scale}px`,
                  fontSize: `${1.84 * scale}px`
                }}
              >1</span>
            </div>
            <div className="bg-[#222222] rounded relative" style={{ width: `${6.9 * scale}px`, height: `${6.9 * scale}px` }}>
              <span 
                className="absolute bg-[#222222] rounded-full border border-white text-white flex items-center justify-center"
                style={{ 
                  top: '-4px',
                  right: '-4px',
                  width: `${3.68 * scale}px`, 
                  height: `${3.68 * scale}px`,
                  fontSize: `${1.84 * scale}px`
                }}
              >3</span>
            </div>
          </div>

          {/* Navigation - Below Logo */}
          <nav className="absolute flex items-center justify-center flex-wrap" style={{ left: '50%', top: `${36.78 * scale}px`, transform: 'translateX(-50%)', gap: `${5.75 * scale}px` }}>
            <a href="#" className="text-[#222222] uppercase" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>men</a>
            <a href="#" className="font-bold text-[#222222] uppercase" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.22em' }}>Women</a>
            <a href="#" className="text-[#222222] uppercase" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>New in</a>
            <a href="#" className="text-[#222222] uppercase" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>clothing</a>
            <a href="#" className="text-[#222222] uppercase" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>shoes</a>
            <a href="#" className="text-[#222222] uppercase" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>bags</a>
            <a href="#" className="text-[#222222] uppercase" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>watches</a>
            <a href="#" className="text-[#222222] uppercase" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>designers</a>
            <a href="#" className="text-[#222222] uppercase" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>custom request</a>
            <a href="#" className="text-[#222222] uppercase" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>personal shopper</a>
          </nav>

          {/* Bottom Border Line */}
          <div 
            className="absolute"
            style={{ 
              bottom: 0,
              left: `${18.39 * scale}px`,
              width: `${291.92 * scale}px`,
              height: `${0.23 * scale}px`,
              backgroundColor: 'rgba(134, 104, 104, 0.35)'
            }}
          ></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative" style={{ maxWidth: `${331 * scale}px`, margin: '0 auto', width: '100%' }}>
        {/* Hero Section with Three Images */}
        <div className="relative" style={{ marginTop: `${70.8 * scale}px` }}>
          <div className="flex relative" style={{ gap: `${4.88 * scale}px` }}>
            {/* Left Image */}
            <div className="bg-gray-200 relative overflow-hidden" style={{ width: `${112.4 * scale}px`, height: `${169.64 * scale}px` }}>
              <Image
                src="/template-images/rectangle-33.png"
                alt=""
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
            
            {/* Middle Image - with Chat Button */}
            <div className="bg-gray-200 relative overflow-hidden" style={{ width: `${113.32 * scale}px`, height: `${169.64 * scale}px`, marginLeft: `${4.88 * scale}px` }}>
              <Image
                src="/template-images/hero-image.png"
                alt=""
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
            
            {/* Right Image */}
            <div className="bg-gray-200 relative overflow-hidden" style={{ width: `${113.32 * scale}px`, height: `${169.64 * scale}px`, marginLeft: `${4.88 * scale}px` }}>
              <Image
                src="/template-images/rectangle-34.png"
                alt=""
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* New In Section */}
        <div className="relative" style={{ marginTop: `${51.94 * scale}px` }}>
          <div className="bg-[#D9D9D9] relative" style={{ opacity: 0.4, padding: `${28.5 * scale}px ${18.39 * scale}px`, height: `${95.16 * scale}px` }}>
            {/* Text and Button Section - Left */}
            <div className="absolute" style={{ left: `${18.39 * scale}px`, top: `${28.5 * scale}px` }}>
              <div className="flex flex-col" style={{ gap: `${9.19 * scale}px` }}>
                <div className="flex flex-col" style={{ gap: `${1.38 * scale}px` }}>
                  <h2 
                    className="font-normal text-[#222222]"
                    style={{ 
                      fontSize: `${10.11 * scale}px`,
                      lineHeight: '1.19em',
                      letterSpacing: '5%'
                    }}
                  >
                    New in
                  </h2>
                  <p 
                    className="font-normal text-[#222222]"
                    style={{ 
                      fontSize: `${3.68 * scale}px`,
                      lineHeight: '1.19em',
                      opacity: 0.6,
                      maxWidth: `${59.99 * scale}px`
                    }}
                  >
                    Shop the latest fashion trends from the top luxury designers.
                  </p>
                </div>
                <button 
                  className="bg-[#222222] text-white font-normal w-fit"
                  style={{ 
                    padding: `${3.68 * scale}px ${13.79 * scale}px`,
                    fontSize: `${3.68 * scale}px`,
                    lineHeight: '1.19em'
                  }}
                >
                  Shop New In
                </button>
              </div>
            </div>

            {/* Designers Grid - Right */}
            <div className="absolute flex" style={{ right: `${18.39 * scale}px`, top: `${9.42 * scale}px`, gap: `${5.06 * scale}px` }}>
              {/* Saint Laurent */}
              <div className="bg-white relative" style={{ width: `${51.49 * scale}px`, height: `${77.23 * scale}px` }}>
                <div className="absolute bg-gray-300" style={{ top: `${3.91 * scale}px`, left: `${3.91 * scale}px`, width: `${43.67 * scale}px`, height: `${59.76 * scale}px` }}>
                  <Image
                    src="/template-images/saint-laurent.png"
                    alt="Saint Laurent"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
                <p 
                  className="absolute text-[#222222] uppercase font-normal"
                  style={{ 
                    bottom: `${4.19 * scale}px`,
                    left: `${9.88 * scale}px`,
                    fontSize: `${4.14 * scale}px`,
                    lineHeight: '1.19em'
                  }}
                >
                  Saint Laurent
                </p>
              </div>

              {/* Loewe */}
              <div className="bg-white relative" style={{ width: `${51.49 * scale}px`, height: `${77.23 * scale}px` }}>
                <div className="absolute bg-gray-300" style={{ top: `${3.91 * scale}px`, left: `${3.91 * scale}px`, width: `${43.67 * scale}px`, height: `${59.76 * scale}px` }}>
                  <Image
                    src="/template-images/loewe.png"
                    alt="Loewe"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
                <p 
                  className="absolute text-[#222222] uppercase font-normal"
                  style={{ 
                    bottom: `${4.19 * scale}px`,
                    left: `${18.62 * scale}px`,
                    fontSize: `${4.14 * scale}px`,
                    lineHeight: '1.19em'
                  }}
                >
                  loewe
                </p>
              </div>

              {/* Balenciaga */}
              <div className="bg-white relative" style={{ width: `${51.26 * scale}px`, height: `${77.23 * scale}px` }}>
                <div className="absolute bg-gray-300" style={{ top: `${3.91 * scale}px`, left: `${3.91 * scale}px`, width: `${43.67 * scale}px`, height: `${59.76 * scale}px` }}>
                  <Image
                    src="/template-images/balenciaga.png"
                    alt="Balenciaga"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
                <p 
                  className="absolute text-[#222222] uppercase font-normal"
                  style={{ 
                    bottom: `${4.19 * scale}px`,
                    left: `${12.87 * scale}px`,
                    fontSize: `${4.14 * scale}px`,
                    lineHeight: '1.19em'
                  }}
                >
                  balenciaga
                </p>
              </div>

              {/* Gucci */}
              <div className="bg-white relative" style={{ width: `${51.49 * scale}px`, height: `${77.23 * scale}px` }}>
                <div className="absolute bg-gray-300" style={{ top: `${3.91 * scale}px`, left: `${3.91 * scale}px`, width: `${43.67 * scale}px`, height: `${59.76 * scale}px` }}>
                  <Image
                    src="/template-images/gucci.png"
                    alt="Gucci"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
                <p 
                  className="absolute text-[#222222] uppercase font-normal"
                  style={{ 
                    bottom: `${4.19 * scale}px`,
                    left: `${19.08 * scale}px`,
                    fontSize: `${4.14 * scale}px`,
                    lineHeight: '1.19em'
                  }}
                >
                  gucci
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Text Banner - Centered */}
        <div className="text-center" style={{ marginTop: `${48.48 * scale}px` }}>
          <h3 
            className="font-extrabold uppercase text-[#222222]"
            style={{ 
              fontSize: `${8.27 * scale}px`,
              lineHeight: '1.45em',
              marginBottom: `${0.87 * scale}px`,
              fontFamily: 'Kaisei Tokumin, serif'
            }}
          >
            a style that fits everyone
          </h3>
          <p 
            className="font-normal text-[#222222]"
            style={{ 
              fontSize: `${5.06 * scale}px`,
              lineHeight: '1.19em'
            }}
          >
            Be inspired by sleek shapes, fresh colors and expressive prints
          </p>
        </div>

        {/* Shop Collection Link - Centered */}
        <div className="text-center" style={{ marginTop: `${11.35 * scale}px` }}>
          <a 
            href="#" 
            className="font-light text-[#222222]"
            style={{ 
              fontSize: `${5.06 * scale}px`,
              lineHeight: '1.21em'
            }}
          >
            Shop collection
          </a>
        </div>

        {/* Products Section - Shoes */}
        <div style={{ marginTop: `${131.58 * scale}px`, padding: `0 ${18.39 * scale}px` }}>
          <h4 
            className="font-medium text-[#222222]"
            style={{ 
              fontSize: `${5.98 * scale}px`,
              lineHeight: '1.45em',
              marginBottom: `${10.03 * scale}px`,
              fontFamily: 'Kaisei Tokumin, serif',
              textAlign: 'right'
            }}
          >
            A shoe for every occasion
          </h4>
          <div className="flex justify-end" style={{ gap: `${4.88 * scale}px`, marginBottom: `${9.49 * scale}px` }}>
            <div className="bg-gray-200 relative" style={{ width: `${144.81 * scale}px`, height: `${160.21 * scale}px` }}>
              <Image
                src="/template-images/product-1.png"
                alt="Shoe product"
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
            <div className="bg-gray-200 relative" style={{ width: `${144.81 * scale}px`, height: `${160.21 * scale}px` }}>
              <Image
                src="/template-images/product-2.png"
                alt="Shoe product"
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          </div>
          <div className="text-right">
            <a 
              href="#" 
              className="font-light text-[#222222]"
              style={{ 
                fontSize: `${5.06 * scale}px`,
                lineHeight: '1.21em',
                opacity: 0.8
              }}
            >
              Shop shoes
            </a>
          </div>
        </div>

        {/* Iconic Designers Section */}
        <div style={{ marginTop: `${14.66 * scale}px`, padding: `0 ${18.39 * scale}px` }}>
          <h5 
            className="font-normal uppercase text-[#222222] text-center"
            style={{ 
              fontSize: `${5.06 * scale}px`,
              lineHeight: '1.19em',
              letterSpacing: '10%',
              marginBottom: `${40.69 * scale}px`
            }}
          >
            Iconic designers
          </h5>
        </div>

        {/* Products Section - Bags */}
        <div style={{ marginTop: `${40.69 * scale}px`, padding: `0 ${18.39 * scale}px` }}>
          <h4 
            className="font-medium text-[#222222]"
            style={{ 
              fontSize: `${5.98 * scale}px`,
              lineHeight: '1.45em',
              marginBottom: `${10.03 * scale}px`,
              fontFamily: 'Kaisei Tokumin, serif'
            }}
          >
            Designer bags
          </h4>
          <a 
            href="#" 
            className="font-light text-[#222222]"
            style={{ 
              fontSize: `${5.06 * scale}px`,
              lineHeight: '1.21em',
              opacity: 0.8
            }}
          >
            Shop bags
          </a>
        </div>

        {/* Featured Brands Grid */}
        <div style={{ marginTop: `${40.69 * scale}px`, padding: `0 ${20 * scale}px` }}>
          <div className="flex flex-wrap justify-center" style={{ gap: `${6.9 * scale}px` }}>
            {/* Bottega Veneta */}
            <div className="flex flex-col items-center" style={{ gap: `${2.3 * scale}px` }}>
              <div className="bg-gray-200 relative" style={{ width: `${42.75 * scale}px`, height: `${64.36 * scale}px` }}>
                <Image
                  src="/template-images/bottega-veneta.png"
                  alt="Bottega Veneta"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
              <p 
                className="font-medium uppercase text-[#222222]"
                style={{ 
                  fontSize: `${3.68 * scale}px`,
                  lineHeight: '1.22em'
                }}
              >
                bottega veneta
              </p>
            </div>

            {/* Balenciaga */}
            <div className="flex flex-col items-center" style={{ gap: `${2.3 * scale}px` }}>
              <div className="bg-gray-200 relative" style={{ width: `${42.75 * scale}px`, height: `${64.36 * scale}px` }}>
                <Image
                  src="/template-images/balenciaga-2.png"
                  alt="Balenciaga"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
              <p 
                className="font-medium uppercase text-[#222222]"
                style={{ 
                  fontSize: `${3.68 * scale}px`,
                  lineHeight: '1.22em'
                }}
              >
                balenciaga
              </p>
            </div>

            {/* Jimmy Choo */}
            <div className="flex flex-col items-center" style={{ gap: `${2.3 * scale}px` }}>
              <div className="bg-gray-200 relative" style={{ width: `${42.75 * scale}px`, height: `${64.36 * scale}px` }}>
                <Image
                  src="/template-images/jimmy-choo.png"
                  alt="Jimmy Choo"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
              <p 
                className="font-medium uppercase text-[#222222]"
                style={{ 
                  fontSize: `${3.68 * scale}px`,
                  lineHeight: '1.22em'
                }}
              >
                jimmy choo
              </p>
            </div>

            {/* Balmain */}
            <div className="flex flex-col items-center" style={{ gap: `${2.3 * scale}px` }}>
              <div className="bg-gray-200 relative" style={{ width: `${42.75 * scale}px`, height: `${64.36 * scale}px` }}>
                <Image
                  src="/template-images/balmain.png"
                  alt="Balmain"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
              <p 
                className="font-medium uppercase text-[#222222]"
                style={{ 
                  fontSize: `${3.68 * scale}px`,
                  lineHeight: '1.22em'
                }}
              >
                balmain
              </p>
            </div>

            {/* Gucci */}
            <div className="flex flex-col items-center" style={{ gap: `${2.3 * scale}px` }}>
              <div className="bg-gray-200 relative" style={{ width: `${42.75 * scale}px`, height: `${64.36 * scale}px` }}>
                <Image
                  src="/template-images/gucci-2.png"
                  alt="Gucci"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
              <p 
                className="font-medium uppercase text-[#222222]"
                style={{ 
                  fontSize: `${3.68 * scale}px`,
                  lineHeight: '1.22em'
                }}
              >
                gucci
              </p>
            </div>

            {/* Loewe */}
            <div className="flex flex-col items-center" style={{ gap: `${2.3 * scale}px` }}>
              <div className="bg-gray-200 relative" style={{ width: `${42.75 * scale}px`, height: `${64.36 * scale}px` }}>
                <Image
                  src="/template-images/loewe-2.png"
                  alt="Loewe"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
              <p 
                className="font-medium uppercase text-[#222222]"
                style={{ 
                  fontSize: `${3.68 * scale}px`,
                  lineHeight: '1.22em'
                }}
              >
                loewe
              </p>
            </div>
          </div>
        </div>

        {/* Chat Button - Positioned according to Figma coordinates */}
        <button 
          className="absolute bg-[#222222] text-white rounded flex items-center z-50"
          style={{ 
            top: `${188.26 * scale}px`,
            right: `${(331 - 278.59) * scale}px`,
            padding: `${3.45 * scale}px`,
            borderRadius: `${1.38 * scale}px`,
            gap: `${1.72 * scale}px`
          }}
        >
          <div className="bg-white rounded" style={{ width: `${5.17 * scale}px`, height: `${5.17 * scale}px` }}></div>
          <span 
            className="font-normal"
            style={{ 
              fontSize: `${3.45 * scale}px`,
              lineHeight: '1.19em'
            }}
          >
            Chat to an expert
          </span>
        </button>

        {/* Footer */}
        <footer className="bg-[#EDE9E9]" style={{ marginTop: `${114.47 * scale}px`, padding: `${13.56 * scale}px ${23.22 * scale}px` }}>
          <div className="flex flex-wrap" style={{ gap: `${39.08 * scale}px` }}>
            {/* Customer Care */}
            <div className="flex flex-col" style={{ gap: `${9.88 * scale}px` }}>
              <h6 
                className="font-medium uppercase text-[#222222]"
                style={{ 
                  fontSize: `${3.68 * scale}px`,
                  lineHeight: '1.22em'
                }}
              >
                Customer care
              </h6>
              <div className="flex flex-col" style={{ gap: `${3.68 * scale}px`, opacity: 0.7 }}>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Contact US</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Track an Order</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Create a Return</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Exchange & Returns</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Delivery</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Payments</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Terms & Conditions</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Privacy</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>FAQs</a>
              </div>
            </div>

            {/* About Us */}
            <div className="flex flex-col" style={{ gap: `${9.88 * scale}px` }}>
              <h6 
                className="font-medium uppercase text-[#222222]"
                style={{ 
                  fontSize: `${3.68 * scale}px`,
                  lineHeight: '1.22em'
                }}
              >
                about us
              </h6>
              <div className="flex flex-col" style={{ gap: `${3.68 * scale}px`, opacity: 0.7 }}>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>About Cosmic Fashion</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Advertising</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>People</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Careers</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Exchange & Returns</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Delivery</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Payments</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Terms & Conditions</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Privacy</a>
              </div>
            </div>

            {/* Affiliate Brands */}
            <div className="flex flex-col" style={{ gap: `${9.88 * scale}px` }}>
              <h6 
                className="font-medium uppercase text-[#222222]"
                style={{ 
                  fontSize: `${3.68 * scale}px`,
                  lineHeight: '1.22em'
                }}
              >
                Affiliate brands
              </h6>
              <div className="flex flex-col" style={{ gap: `${3.68 * scale}px`, opacity: 0.7 }}>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Gucci</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Balenciaga</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Off-White</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Loewe</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>SAINT LAURENT</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Dolce & Gabbana</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Prada</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Versace</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Balmain</a>
              </div>
            </div>

            {/* Socials */}
            <div className="flex flex-col" style={{ gap: `${9.88 * scale}px` }}>
              <h6 
                className="font-medium uppercase text-[#222222]"
                style={{ 
                  fontSize: `${3.68 * scale}px`,
                  lineHeight: '1.22em'
                }}
              >
                Socials
              </h6>
              <div className="flex flex-col" style={{ gap: `${3.68 * scale}px`, opacity: 0.7 }}>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Instagram</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Twitter</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>YouTube</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Snapchat</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Facebook</a>
                <a href="#" className="font-normal text-[#222222]" style={{ fontSize: `${3.68 * scale}px`, lineHeight: '1.19em' }}>Pinterest</a>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div style={{ marginTop: `${67.35 * scale}px` }}>
            <p 
              className="font-medium uppercase text-[#222222]"
              style={{ 
                fontSize: `${3.68 * scale}px`,
                lineHeight: '1.22em',
                opacity: 0.7,
                marginBottom: `${5.2 * scale}px`
              }}
            >
              cosmic fashion accepts
            </p>
            <div className="flex" style={{ gap: `${6.9 * scale}px` }}>
              <div className="bg-[#222222] rounded" style={{ width: `${6.9 * scale}px`, height: `${6.9 * scale}px` }}></div>
              <div className="bg-[#222222] rounded" style={{ width: `${6.9 * scale}px`, height: `${6.9 * scale}px` }}></div>
              <div className="bg-[#222222] rounded" style={{ width: `${6.9 * scale}px`, height: `${6.9 * scale}px` }}></div>
              <div className="bg-[#222222] rounded" style={{ width: `${6.9 * scale}px`, height: `${6.9 * scale}px` }}></div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
