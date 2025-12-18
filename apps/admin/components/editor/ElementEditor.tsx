'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@white-label/ui'
import { X } from 'lucide-react'
import type { ElementStyles } from '@/components/blocks/types'

interface SelectedElement {
  id: string
  tag: string
  props: Record<string, unknown>
  styles: Record<string, string>
  bounds: {
    top: number
    left: number
    width: number
    height: number
  }
}

interface ElementEditorProps {
  selectedElement: SelectedElement | null
  onStyleUpdate: (elementId: string, property: string, value: string) => void
  onPropsUpdate: (elementId: string, props: Record<string, unknown>) => void
  onClose?: () => void
}

export function ElementEditor({ selectedElement, onStyleUpdate, onPropsUpdate, onClose }: ElementEditorProps) {
  const [localStyles, setLocalStyles] = useState<ElementStyles>({})
  const [localProps, setLocalProps] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (selectedElement) {
      // Converter estilos do elemento para o formato local
      const styles: ElementStyles = {
        color: selectedElement.styles.color,
        backgroundColor: selectedElement.styles.backgroundColor,
        fontSize: selectedElement.styles.fontSize,
        fontWeight: selectedElement.styles.fontWeight,
        fontFamily: selectedElement.styles.fontFamily,
        lineHeight: selectedElement.styles.lineHeight,
        letterSpacing: selectedElement.styles.letterSpacing,
        textAlign: (selectedElement.styles.textAlign as ElementStyles['textAlign']) || 'left',
        marginTop: selectedElement.styles.marginTop,
        marginBottom: selectedElement.styles.marginBottom,
        marginLeft: selectedElement.styles.marginLeft,
        marginRight: selectedElement.styles.marginRight,
        paddingTop: selectedElement.styles.paddingTop,
        paddingBottom: selectedElement.styles.paddingBottom,
        paddingLeft: selectedElement.styles.paddingLeft,
        paddingRight: selectedElement.styles.paddingRight,
        borderWidth: selectedElement.styles.borderWidth,
        borderStyle: selectedElement.styles.borderStyle,
        borderColor: selectedElement.styles.borderColor,
        borderRadius: selectedElement.styles.borderRadius,
        width: selectedElement.styles.width,
        height: selectedElement.styles.height,
        display: selectedElement.styles.display,
        justifyContent: selectedElement.styles.justifyContent,
        alignItems: selectedElement.styles.alignItems,
      }
      setLocalStyles(styles)
      setLocalProps(selectedElement.props)
    }
  }, [selectedElement])

  const handleStyleChange = (property: keyof ElementStyles, value: string) => {
    setLocalStyles(prev => ({ ...prev, [property]: value }))
    if (selectedElement) {
      onStyleUpdate(selectedElement.id, property, value)
    }
  }

  const handlePropChange = (key: string, value: unknown) => {
    setLocalProps(prev => ({ ...prev, [key]: value }))
    if (selectedElement) {
      onPropsUpdate(selectedElement.id, { ...localProps, [key]: value })
    }
  }

  if (!selectedElement) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-sm uppercase tracking-wide">Editor de Elemento</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Selecione um elemento no preview para editar</p>
            <p className="text-xs mt-2">Ative o modo "Selecionar Elemento" e clique em um elemento</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wide">Editor de Elemento</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedElement.tag} • {selectedElement.id}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors"
              aria-label="Fechar editor"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <Tabs defaultValue="content" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
          <TabsTrigger value="content" className="rounded-none">Conteúdo</TabsTrigger>
          <TabsTrigger value="styles" className="rounded-none">Estilos</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
          {/* Conteúdo baseado no tipo de elemento */}
          {selectedElement.tag === 'h1' || selectedElement.tag === 'h2' || selectedElement.tag === 'h3' || 
           selectedElement.tag === 'h4' || selectedElement.tag === 'h5' || selectedElement.tag === 'h6' || 
           selectedElement.tag === 'p' || selectedElement.tag === 'span' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo</Label>
                <Input
                  id="content"
                  value={(localProps.textContent as string) || ''}
                  onChange={(e) => handlePropChange('textContent', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tag">Tag HTML</Label>
                <Select
                  value={(localProps.tag as string) || 'p'}
                  onValueChange={(value) => handlePropChange('tag', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="h1">H1</SelectItem>
                    <SelectItem value="h2">H2</SelectItem>
                    <SelectItem value="h3">H3</SelectItem>
                    <SelectItem value="h4">H4</SelectItem>
                    <SelectItem value="h5">H5</SelectItem>
                    <SelectItem value="h6">H6</SelectItem>
                    <SelectItem value="p">P</SelectItem>
                    <SelectItem value="span">Span</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : selectedElement.tag === 'img' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="src">URL da Imagem</Label>
                <Input
                  id="src"
                  type="url"
                  value={(localProps.src as string) || ''}
                  onChange={(e) => handlePropChange('src', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alt">Texto Alternativo</Label>
                <Input
                  id="alt"
                  value={(localProps.alt as string) || ''}
                  onChange={(e) => handlePropChange('alt', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Largura (px)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={(localProps.width as number) || ''}
                    onChange={(e) => handlePropChange('width', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Altura (px)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={(localProps.height as number) || ''}
                    onChange={(e) => handlePropChange('height', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </>
          ) : selectedElement.tag === 'a' || selectedElement.tag === 'button' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={(localProps.textContent as string) || ''}
                  onChange={(e) => handlePropChange('textContent', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="href">Link</Label>
                <Input
                  id="href"
                  type="url"
                  value={(localProps.href as string) || ''}
                  onChange={(e) => handlePropChange('href', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Target</Label>
                <Select
                  value={(localProps.target as string) || '_self'}
                  onValueChange={(value) => handlePropChange('target', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_self">Mesma aba</SelectItem>
                    <SelectItem value="_blank">Nova aba</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Edição de conteúdo não disponível para este tipo de elemento.
            </div>
          )}
        </TabsContent>

        <TabsContent value="styles" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
          {/* Tipografia */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide">Tipografia</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Cor</Label>
                <Input
                  id="color"
                  type="color"
                  value={localStyles.color || '#000000'}
                  onChange={(e) => handleStyleChange('color', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontSize">Tamanho da Fonte</Label>
                <Input
                  id="fontSize"
                  value={localStyles.fontSize || ''}
                  onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                  placeholder="16px"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontWeight">Peso da Fonte</Label>
                <Select
                  value={localStyles.fontWeight || '400'}
                  onValueChange={(value) => handleStyleChange('fontWeight', value || '')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 - Thin</SelectItem>
                    <SelectItem value="300">300 - Light</SelectItem>
                    <SelectItem value="400">400 - Normal</SelectItem>
                    <SelectItem value="500">500 - Medium</SelectItem>
                    <SelectItem value="600">600 - Semi Bold</SelectItem>
                    <SelectItem value="700">700 - Bold</SelectItem>
                    <SelectItem value="900">900 - Black</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontFamily">Fonte</Label>
                <Input
                  id="fontFamily"
                  value={localStyles.fontFamily || ''}
                  onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                  placeholder="Arial, sans-serif"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lineHeight">Altura da Linha</Label>
                <Input
                  id="lineHeight"
                  value={localStyles.lineHeight || ''}
                  onChange={(e) => handleStyleChange('lineHeight', e.target.value)}
                  placeholder="1.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="letterSpacing">Espaçamento</Label>
                <Input
                  id="letterSpacing"
                  value={localStyles.letterSpacing || ''}
                  onChange={(e) => handleStyleChange('letterSpacing', e.target.value)}
                  placeholder="0px"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="textAlign">Alinhamento</Label>
                <Select
                  value={localStyles.textAlign || 'left'}
                  onValueChange={(value: string) => {
                    handleStyleChange('textAlign', value || 'left')
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Esquerda</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="right">Direita</SelectItem>
                    <SelectItem value="justify">Justificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Espaçamento */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide">Espaçamento</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marginTop">Margin Top</Label>
                <Input
                  id="marginTop"
                  value={localStyles.marginTop || ''}
                  onChange={(e) => handleStyleChange('marginTop', e.target.value)}
                  placeholder="0px"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marginBottom">Margin Bottom</Label>
                <Input
                  id="marginBottom"
                  value={localStyles.marginBottom || ''}
                  onChange={(e) => handleStyleChange('marginBottom', e.target.value)}
                  placeholder="0px"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marginLeft">Margin Left</Label>
                <Input
                  id="marginLeft"
                  value={localStyles.marginLeft || ''}
                  onChange={(e) => handleStyleChange('marginLeft', e.target.value)}
                  placeholder="0px"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marginRight">Margin Right</Label>
                <Input
                  id="marginRight"
                  value={localStyles.marginRight || ''}
                  onChange={(e) => handleStyleChange('marginRight', e.target.value)}
                  placeholder="0px"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paddingTop">Padding Top</Label>
                <Input
                  id="paddingTop"
                  value={localStyles.paddingTop || ''}
                  onChange={(e) => handleStyleChange('paddingTop', e.target.value)}
                  placeholder="0px"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paddingBottom">Padding Bottom</Label>
                <Input
                  id="paddingBottom"
                  value={localStyles.paddingBottom || ''}
                  onChange={(e) => handleStyleChange('paddingBottom', e.target.value)}
                  placeholder="0px"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paddingLeft">Padding Left</Label>
                <Input
                  id="paddingLeft"
                  value={localStyles.paddingLeft || ''}
                  onChange={(e) => handleStyleChange('paddingLeft', e.target.value)}
                  placeholder="0px"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paddingRight">Padding Right</Label>
                <Input
                  id="paddingRight"
                  value={localStyles.paddingRight || ''}
                  onChange={(e) => handleStyleChange('paddingRight', e.target.value)}
                  placeholder="0px"
                />
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide">Visual</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Cor de Fundo</Label>
                <Input
                  id="backgroundColor"
                  type="color"
                  value={localStyles.backgroundColor || '#ffffff'}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="borderRadius">Border Radius</Label>
                <Input
                  id="borderRadius"
                  value={localStyles.borderRadius || ''}
                  onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                  placeholder="0px"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="borderWidth">Largura da Borda</Label>
                <Input
                  id="borderWidth"
                  value={localStyles.borderWidth || ''}
                  onChange={(e) => handleStyleChange('borderWidth', e.target.value)}
                  placeholder="0px"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="borderStyle">Estilo da Borda</Label>
                <Select
                  value={localStyles.borderStyle || 'solid'}
                  onValueChange={(value) => handleStyleChange('borderStyle', value || '')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    <SelectItem value="solid">Sólida</SelectItem>
                    <SelectItem value="dashed">Tracejada</SelectItem>
                    <SelectItem value="dotted">Pontilhada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="borderColor">Cor da Borda</Label>
                <Input
                  id="borderColor"
                  type="color"
                  value={localStyles.borderColor || '#000000'}
                  onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Layout */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide">Layout</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width">Largura</Label>
                <Input
                  id="width"
                  value={localStyles.width || ''}
                  onChange={(e) => handleStyleChange('width', e.target.value)}
                  placeholder="auto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Altura</Label>
                <Input
                  id="height"
                  value={localStyles.height || ''}
                  onChange={(e) => handleStyleChange('height', e.target.value)}
                  placeholder="auto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display">Display</Label>
                <Select
                  value={localStyles.display || 'block'}
                  onValueChange={(value) => handleStyleChange('display', value || '')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block">Block</SelectItem>
                    <SelectItem value="inline">Inline</SelectItem>
                    <SelectItem value="inline-block">Inline Block</SelectItem>
                    <SelectItem value="flex">Flex</SelectItem>
                    <SelectItem value="grid">Grid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {localStyles.display === 'flex' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="justifyContent">Justify Content</Label>
                    <Select
                      value={localStyles.justifyContent || 'flex-start'}
                      onValueChange={(value) => handleStyleChange('justifyContent', value || '')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flex-start">Flex Start</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="flex-end">Flex End</SelectItem>
                        <SelectItem value="space-between">Space Between</SelectItem>
                        <SelectItem value="space-around">Space Around</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alignItems">Align Items</Label>
                    <Select
                      value={localStyles.alignItems || 'stretch'}
                      onValueChange={(value) => handleStyleChange('alignItems', value || '')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stretch">Stretch</SelectItem>
                        <SelectItem value="flex-start">Flex Start</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="flex-end">Flex End</SelectItem>
                        <SelectItem value="baseline">Baseline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

