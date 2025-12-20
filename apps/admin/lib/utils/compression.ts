import pako from 'pako'

/**
 * Comprime um objeto JSON usando gzip
 * @param data Objeto a ser comprimido
 * @returns ArrayBuffer comprimido
 */
export function compressJson(data: unknown): ArrayBuffer {
  const jsonString = JSON.stringify(data)
  const uint8Array = new TextEncoder().encode(jsonString)
  const compressed = pako.gzip(uint8Array)
  return compressed.buffer
}

/**
 * Descomprime um ArrayBuffer gzip para objeto JSON
 * @param compressed ArrayBuffer comprimido
 * @returns Objeto descomprimido
 */
export function decompressJson<T = unknown>(compressed: ArrayBuffer): T {
  const uint8Array = new Uint8Array(compressed)
  const decompressed = pako.ungzip(uint8Array)
  const jsonString = new TextDecoder().decode(decompressed)
  return JSON.parse(jsonString) as T
}

/**
 * Verifica se o tamanho do JSON serializado excede um limite
 * @param data Objeto a verificar
 * @param limitBytes Limite em bytes (padrão: 500KB)
 * @returns true se exceder o limite
 */
export function exceedsSizeLimit(data: unknown, limitBytes: number = 500 * 1024): boolean {
  const jsonString = JSON.stringify(data)
  return jsonString.length > limitBytes
}

