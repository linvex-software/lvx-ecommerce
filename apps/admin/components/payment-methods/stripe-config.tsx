'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@white-label/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2, Save } from 'lucide-react'
import { usePaymentMethods, useCreatePaymentMethod, useUpdatePaymentMethod } from '@/lib/hooks/use-payment-methods'

interface StripeConfigProps {
  onActiveChange?: (active: boolean) => void
}

export function StripeConfig({ onActiveChange }: StripeConfigProps) {
  const { data: paymentMethods, isLoading } = usePaymentMethods()
  const createPaymentMethod = useCreatePaymentMethod()
  const updatePaymentMethod = useUpdatePaymentMethod()

  const [publicKey, setPublicKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [active, setActive] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const stripeMethod = paymentMethods?.find((pm) => pm.provider === 'stripe')

  useEffect(() => {
    if (stripeMethod) {
      const config = stripeMethod.config_json as Record<string, unknown> | null
      setPublicKey((config?.public_key as string) || '')
      setSecretKey((config?.secret_key as string) || '')
      setActive(stripeMethod.active)
    }
  }, [stripeMethod])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (stripeMethod) {
        // Atualizar existente
        await updatePaymentMethod.mutateAsync({
          id: stripeMethod.id,
          data: {
            config_json: {
              public_key: publicKey,
              secret_key: secretKey
            },
            active
          }
        })
      } else {
        // Criar novo
        await createPaymentMethod.mutateAsync({
          name: 'Stripe',
          provider: 'stripe',
          config_json: {
            public_key: publicKey,
            secret_key: secretKey
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

  const handleActiveChange = async (checked: boolean) => {
    setActive(checked)
    // Se já existe método, atualizar imediatamente
    if (stripeMethod) {
      try {
        await updatePaymentMethod.mutateAsync({
          id: stripeMethod.id,
          data: { active: checked }
        })
        onActiveChange?.(checked)
      } catch (error) {
        console.error('Erro ao alterar status:', error)
        // Reverter o estado em caso de erro
        setActive(!checked)
      }
    } else {
      // Se não existe, apenas notificar o componente pai
      onActiveChange?.(checked)
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
        <CardTitle className="text-xl font-light">Stripe</CardTitle>
        <CardDescription>
          Configure suas chaves de API do Stripe para processar pagamentos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="publicKey" className="text-sm font-light text-gray-700">
            Public Key
          </Label>
          <Input
            id="publicKey"
            type="text"
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            placeholder="pk_test_..."
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-500">
            Chave pública (publishable key) do Stripe. Encontre em{' '}
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              API Keys
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="secretKey" className="text-sm font-light text-gray-700">
            Secret Key
          </Label>
          <Input
            id="secretKey"
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="sk_test_..."
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-500">
            Chave secreta (secret key) do Stripe. Mantenha esta chave em segredo.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="active" className="text-sm font-light text-gray-700">
              Ativo
            </Label>
            <p className="text-xs text-gray-500">
              Ative ou desative o método de pagamento Stripe
            </p>
          </div>
          <Switch
            id="active"
            checked={active}
            onCheckedChange={handleActiveChange}
            disabled={updatePaymentMethod.isPending}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !publicKey || !secretKey}
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

        {stripeMethod && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-900 mb-1">
              ✅ Método de pagamento configurado
            </p>
            <p className="text-xs text-green-800">
              O Stripe está {active ? 'ativo' : 'inativo'} e pronto para processar pagamentos.
            </p>
          </div>
        )}

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900 mb-2">
            💡 Como configurar
          </p>
          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
            <li>Acesse o painel do Stripe e crie suas credenciais de teste ou produção</li>
            <li>Copie a Public Key (publishable key) e a Secret Key</li>
            <li>Cole as chaves nos campos acima e salve</li>
            <li>Configure a mesma Public Key no arquivo .env da aplicação web como <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_STRIPE_PUBLIC_KEY</code></li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

