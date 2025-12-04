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
          <h1 className="text-4xl font-light tracking-tight text-gray-900">Loja</h1>
          <p className="mt-2 text-sm font-light text-gray-500">
            Informações da sua loja
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">
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
        <h1 className="text-4xl font-light tracking-tight text-gray-900">Loja</h1>
        <p className="mt-2 text-sm font-light text-gray-500">
          Informações da sua loja e configuração para deploy
        </p>
      </div>

      {/* Store Info Card */}
      <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-light">Informações da Loja</CardTitle>
          <CardDescription>
            Dados básicos da sua loja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.store && (
            <>
              <div>
                <Label className="text-sm font-light text-gray-700">Nome</Label>
                <p className="mt-1 text-sm text-gray-900">{user.store.name}</p>
              </div>
              <div>
                <Label className="text-sm font-light text-gray-700">Domínio</Label>
                <p className="mt-1 text-sm text-gray-900">{user.store.domain}</p>
              </div>
              <div>
                <Label className="text-sm font-light text-gray-700">Status</Label>
                <p className="mt-1">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.store.active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.store.active ? 'Ativa' : 'Inativa'}
                  </span>
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Store ID Card */}
      <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-light">Store ID</CardTitle>
          <CardDescription>
            Use este ID para configurar sua aplicação web no deploy ou no arquivo .env
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeId" className="text-sm font-light text-gray-700">
              ID da Loja
            </Label>
            <div className="flex gap-2">
              <Input
                id="storeId"
                type="text"
                value={storeId}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                type="button"
                onClick={handleCopy}
                className="px-4"
                variant="outline"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <Label className="text-sm font-light text-gray-700">
              Variável de ambiente (.env)
            </Label>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <code className="text-sm font-mono text-gray-900">{envExample}</code>
            </div>
            <Button
              type="button"
              onClick={handleCopyEnv}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar variável de ambiente
            </Button>
          </div>

          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">
              💡 Como usar
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Copie o Store ID acima</li>
              <li>Adicione no arquivo .env da aplicação web: <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_STORE_ID=seu-store-id</code></li>
              <li>Ou configure como variável de ambiente no seu serviço de deploy</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Logo Configuration Card */}
      <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-light">Logo da Loja</CardTitle>
          <CardDescription>
            Configure o logo que aparecerá na sua loja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingTheme ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm font-light text-gray-500">Carregando...</div>
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

    </div>
  )
}

