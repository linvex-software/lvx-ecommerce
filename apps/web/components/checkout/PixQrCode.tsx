'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PixQrCodeProps {
  qrCode: string
  qrCodeBase64?: string
  ticketUrl?: string
}

export function PixQrCode({ qrCode, qrCodeBase64, ticketUrl }: PixQrCodeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Erro ao copiar código:', error)
    }
  }

  return (
    <div className="space-y-4 p-6 border rounded-lg bg-background">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Escaneie o QR Code</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Use o aplicativo do seu banco para escanear o código e concluir o pagamento
        </p>
      </div>

      {qrCodeBase64 && (
        <div className="flex justify-center">
          <img
            src={`data:image/png;base64,${qrCodeBase64}`}
            alt="QR Code PIX"
            className="w-64 h-64 border rounded-lg p-4 bg-white"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Código PIX (Copiar e Colar)</label>
        <div className="flex gap-2">
          <Input
            value={qrCode}
            readOnly
            className="font-mono text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {ticketUrl && (
        <Button
          asChild
          variant="outline"
          className="w-full"
        >
          <a href={ticketUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir página de pagamento
          </a>
        </Button>
      )}

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Importante:</strong> O pagamento será aprovado automaticamente após a confirmação.
          Você receberá um e-mail com a confirmação.
        </p>
      </div>
    </div>
  )
}


