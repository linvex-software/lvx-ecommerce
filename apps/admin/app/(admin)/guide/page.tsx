'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Store,
  Package,
  Tags,
  Truck,
  ShoppingCart,
  Video
} from 'lucide-react'

const steps = [
  {
    icon: Store,
    title: 'Configurar a loja',
    description: 'Defina nome, domínio e dados básicos da sua loja.'
  },
  {
    icon: Package,
    title: 'Cadastrar produtos',
    description: 'Adicione produtos com preços, imagens, estoque e variações.'
  },
  {
    icon: Tags,
    title: 'Organizar categorias',
    description: 'Crie categorias para estruturar o catálogo e facilitar a navegação.'
  },
  {
    icon: Truck,
    title: 'Configurar frete e pagamentos',
    description: 'Defina opções de envio e formas de pagamento disponíveis.'
  },
  {
    icon: ShoppingCart,
    title: 'Acompanhar pedidos',
    description: 'Monitore status dos pedidos, pagamentos e expedição.'
  }
]

export default function GuidePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">Como usar</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Veja o passo a passo para configurar e usar o painel da sua loja.
        </p>
      </div>

      {/* Passos principais */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <Card key={step.title} className="dark:bg-surface-2 dark:border-[#1D1D1D]">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-text-tertiary">
                    Passo {index + 1}
                  </span>
                </div>
                <CardTitle className="text-lg font-semibold text-text-primary dark:text-white">
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-text-secondary dark:text-[#B5B5B5]">
                  {step.description}
                </CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Seção de vídeos */}
      <Card className="dark:bg-surface-2 dark:border-[#1D1D1D]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-text-primary dark:text-white">
                Vídeos tutoriais (em breve)
              </CardTitle>
              <CardDescription className="text-text-secondary dark:text-[#B5B5B5]">
                Em breve você poderá assistir a vídeos explicando cada etapa de uso do painel.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border bg-surface p-12 text-center dark:bg-[#111111] dark:border-[#2A2A2A]">
            <Video className="h-12 w-12 mx-auto mb-4 text-text-tertiary dark:text-white/40" />
            <p className="text-sm font-medium text-text-secondary dark:text-[#B5B5B5] mb-2">
              Área reservada para vídeo
            </p>
            <p className="text-xs text-text-tertiary dark:text-[#777777]">
              Os vídeos tutoriais estarão disponíveis em breve
            </p>
            {/* Espaço reservado para iframe ou video player */}
            <div className="mt-6 aspect-video bg-background rounded-lg border border-border dark:bg-[#050505] dark:border-[#1D1D1D] flex items-center justify-center">
              <p className="text-xs text-text-tertiary dark:text-[#777777]">
                Player de vídeo será exibido aqui
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

