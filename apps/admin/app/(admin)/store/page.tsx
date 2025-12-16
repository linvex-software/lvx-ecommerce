'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@white-label/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/products/image-upload'
import { useStoreTheme, useUpdateStoreLogo, useUpdateStoreBanner } from '@/lib/hooks/use-store-theme'
import { MercadoPagoConfig } from '@/components/payment-methods/mercado-pago-config'

export default function StorePage() {
  const user = useAuthStore((state) => state.user)
  const [copied, setCopied] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)

  const storeId = user?.storeId || user?.store?.id || ''

  const { data: theme, isLoading: isLoadingTheme } = useStoreTheme()
  const updateLogo = useUpdateStoreLogo()
  const updateBanner = useUpdateStoreBanner()

  useEffect(() => {
    if (theme) {
      setLogoUrl(theme.logo_url)
      setBannerUrl(theme.banner_url)
    }
  }, [theme])

  const handleCopy = async () => {
    if (!storeId) {
      toast.error('Store ID não disponível')
      return
    }

    try {
      await navigator.clipboard.writeText(storeId)
      setCopied(true)
      toast.success('Store ID copiado para a área de transferência!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Erro ao copiar Store ID')
    }
  }

  const envExample = `NEXT_PUBLIC_STORE_ID=${storeId}`

  const handleCopyEnv = async () => {
    try {
      await navigator.clipboard.writeText(envExample)
      toast.success('Variável de ambiente copiada!')
    } catch (error) {
      toast.error('Erro ao copiar')
    }
  }

  if (!user || !storeId) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">Loja</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Informações da sua loja
          </p>
        </div>
        <Card className="dark:bg-surface-2 dark:border-[#1D1D1D]">
          <CardContent className="pt-6">
            <p className="text-sm text-text-secondary">
              Nenhuma loja encontrada. Complete o onboarding para criar sua loja.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">Loja</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Informações da sua loja e configuração para deploy
        </p>
      </div>

      {/* Store Info Card */}
      <Card className="dark:bg-surface-2 dark:border-[#1D1D1D]">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-text-primary">Informações da Loja</CardTitle>
          <CardDescription className="text-text-secondary">
            Dados básicos da sua loja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.store && (
            <>
              <div>
                <Label className="text-sm font-semibold text-text-primary dark:text-[#CCCCCC]">Nome</Label>
                <p className="mt-1 text-sm text-text-primary dark:text-white">{user.store.name}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-text-primary dark:text-[#CCCCCC]">Domínio</Label>
                <p className="mt-1 text-sm text-text-primary dark:text-white">{user.store.domain}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-text-primary dark:text-[#CCCCCC]">Status</Label>
                <p className="mt-1">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.store.active
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border dark:border-emerald-800/50'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 dark:border dark:border-gray-700'
                  }`}>
                    {user.store.active ? 'Ativa' : 'Inativa'}
                  </span>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Logo Configuration Card */}
      <Card className="dark:bg-surface-2 dark:border-[#1D1D1D]">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-text-primary">Logo da Loja</CardTitle>
          <CardDescription className="text-text-secondary">
            Configure o logo que aparecerá na sua loja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingTheme ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-text-secondary">Carregando...</div>
            </div>
          ) : (
            <>
              <div className="max-w-xs">
                <ImageUpload
                  value={logoUrl}
                  onChange={(url) => {
                    setLogoUrl(url)
                    if (url) {
                      updateLogo.mutate(url)
                    }
                  }}
                  disabled={updateLogo.isPending}
                />
              </div>
              {logoUrl && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setLogoUrl(null)
                      updateLogo.mutate(null)
                    }}
                    disabled={updateLogo.isPending}
                  >
                    Remover logo
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods Configuration */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-text-primary mb-6">Métodos de Pagamento</h2>
        <MercadoPagoConfig />
      </div>

    </div>
  )
}
