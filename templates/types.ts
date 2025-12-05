/**
 * Tipos para o sistema de templates
 */

export interface TemplateTheme {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  buttonColor: string
  textColor: string
}

export interface TemplateBranding {
  logoUrl: string
  faviconUrl: string
  storeName: string
}

export interface TemplateContent {
  home: {
    heroTitle: string
    heroSubtitle: string
  }
  footer: {
    policyText: string
  }
}

export interface TemplateConfig {
  theme: TemplateTheme
  branding: TemplateBranding
  content: TemplateContent
}

export interface Template {
  id: string
  name: string
  description: string
  config: TemplateConfig
}




