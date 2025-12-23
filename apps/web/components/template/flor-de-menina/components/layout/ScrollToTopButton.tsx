'use client'

import { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      // Mostrar botão quando o usuário rolar mais de 300px
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true })
    
    // Verificar estado inicial
    toggleVisibility()

    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [])

  const scrollToTop = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Função de scroll suave customizada
    const smoothScrollToTop = () => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
      
      if (currentScroll > 0) {
        // Calcular posição com easing (easeInOutCubic)
        const targetScroll = currentScroll - (currentScroll / 8)
        
        window.scrollTo(0, targetScroll)
        
        // Continuar animação até chegar ao topo
        requestAnimationFrame(smoothScrollToTop)
      } else {
        // Garantir que chegou ao topo
        window.scrollTo(0, 0)
      }
    }
    
    // Tentar primeiro com scroll-behavior: smooth
    if ('scrollBehavior' in document.documentElement.style) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      })
    } else {
      // Fallback: animação customizada
      smoothScrollToTop()
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full",
        "flex items-center justify-center shadow-lg hover:shadow-xl",
        "hover:scale-110 transition-all duration-300",
        "group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      )}
      aria-label="Voltar ao topo"
    >
      <ArrowUp size={24} className="transition-transform group-hover:-translate-y-1" />
    </button>
  )
}

