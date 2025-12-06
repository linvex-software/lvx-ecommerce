'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@white-label/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Save } from 'lucide-react'
import { usePaymentMethods, useCreatePaymentMethod, useUpdatePaymentMethod } from '@/lib/hooks/use-payment-methods'

export function MercadoPagoConfig() {
  const { data: paymentMethods, isLoading } = usePaymentMethods()
  const createPaymentMethod = useCreatePaymentMethod()
  const updatePaymentMethod = useUpdatePaymentMethod()

  const [accessToken, setAccessToken] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [active, setActive] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const mercadoPagoMethod = paymentMethods?.find((pm) => pm.provider === 'mercadopago')

  useEffect(() => {
    if (mercadoPagoMethod) {
      const config = mercadoPagoMethod.config_json as Record<string, unknown> | null
      setAccessToken((config?.access_token as string) || '')
      setPublicKey((config?.public_key as string) || '')
      setActive(mercadoPagoMethod.active)
    }
  }, [mercadoPagoMethod])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (mercadoPagoMethod) {
        // Atualizar existente
        await updatePaymentMethod.mutateAsync({
          id: mercadoPagoMethod.id,
          data: {
            config_json: {
              access_token: accessToken,
              public_key: publicKey
            },
            active
          }
        })
      } else {
        // Criar novo
        await createPaymentMethod.mutateAsync({
          name: 'Mercado Pago',
          provider: 'mercadopago',
          config_json: {
            access_token: accessToken,
            public_key: publicKey
          },
          active
        })
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-sm font-light text-gray-500">Carregando...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-light">Mercado Pago</CardTitle>
        <CardDescription>
          Configure suas chaves de API do Mercado Pago para processar pagamentos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="accessToken" className="text-sm font-light text-gray-700">
            Access Token
          </Label>
          <Input
            id="accessToken"
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="APP_USR-..."
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-500">
            Token de acesso do Mercado Pago. Encontre em{' '}
            <a
              href="https://www.mercadopago.com.br/developers/panel/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Credenciais do desenvolvedor
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="publicKey" className="text-sm font-light text-gray-700">
            Public Key
          </Label>
          <Input
            id="publicKey"
            type="text"
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            placeholder="APP_USR-..."
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-500">
            Chave pública do Mercado Pago. Use a mesma chave pública nas configurações da aplicação web.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="active" className="text-sm font-light text-gray-700">
              Ativo
            </Label>
            <p className="text-xs text-gray-500">
              Ative ou desative o método de pagamento Mercado Pago
            </p>
          </div>
          <Switch
            id="active"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !accessToken || !publicKey}
            className="min-w-[120px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </Button>
        </div>

        {mercadoPagoMethod && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-900 mb-1">
              ✅ Método de pagamento configurado
            </p>
            <p className="text-xs text-green-800">
              O Mercado Pago está {active ? 'ativo' : 'inativo'} e pronto para processar pagamentos.
            </p>
          </div>
        )}

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900 mb-2">
            💡 Como configurar
          </p>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>Acesse o painel do Mercado Pago e crie suas credenciais de teste ou produção</li>
            <li>Copie o Access Token e a Public Key</li>
            <li>Cole as chaves nos campos acima e salve</li>
            <li>Configure a mesma Public Key no arquivo .env da aplicação web como <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_MP_PUBLIC_KEY</code></li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

