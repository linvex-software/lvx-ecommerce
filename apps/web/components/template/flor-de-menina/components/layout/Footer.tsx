'use client'

import Link from "next/link";
import { Instagram, Phone, MapPin, Mail, MessageCircle, Facebook, Youtube, Twitter, Linkedin } from "lucide-react";
import { useSafeNode } from "../../lib/hooks/use-safe-node";
import { EditableText } from "../common/editable-text";
import { Element, useNode } from '@craftjs/core';
import { useStoreSettings } from "@/lib/hooks/use-store-settings";

export function Footer() {
  const { connectors: { connect } } = useSafeNode();
  const { data: settings } = useStoreSettings();

  // Obter nodeId do Footer para gerar IDs únicos
  let nodeId = 'node_footer';
  try {
    const node = useNode();
    nodeId = node.id;
  } catch {
    // Não está no contexto do editor
  }

  return (
    <footer ref={(ref: HTMLElement | null) => ref && connect(ref)} className="bg-charcoal text-secondary mt-20">
      {/* Newsletter */}
      <div className="bg-primary py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="font-display text-2xl lg:text-3xl text-primary-foreground mb-2">
            <Element
              id={`${nodeId}_newsletter_title`}
              is={EditableText}
              tag="span"
              className=""
              content="Receba Novidades em Primeira Mão"
            />
          </h3>
          <Element
            id={`${nodeId}_newsletter_description`}
            is={EditableText}
            tag="p"
            className="text-primary-foreground/80 mb-6 font-body text-sm"
            content="Cadastre-se e ganhe 10% OFF na primeira compra"
          />
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Seu melhor e-mail"
              className="flex-1 px-4 py-3 bg-primary-foreground text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <button
              type="submit"
              className="px-8 py-3 bg-gold text-accent-foreground font-body text-sm tracking-wider uppercase hover:bg-gold-light transition-colors"
            >
              <Element
                id={`${nodeId}_newsletter_button`}
                is={EditableText}
                tag="span"
                className=""
                content="Inscrever"
              />
            </button>
          </form>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div>
            <h4 className="font-display text-2xl text-secondary mb-4">
              {settings?.name || "Minha Loja"}
            </h4>
            <Element
              id={`${nodeId}_brand_description`}
              is={EditableText}
              tag="p"
              className="text-secondary/70 text-sm font-body leading-relaxed mb-6"
              content="Moda feminina com elegância e sofisticação. Peças exclusivas para mulheres que valorizam estilo e qualidade."
            />
            <div className="flex gap-4">
              {settings?.social_media?.instagram && (
                <a
                  href={settings.social_media.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-white/80 text-white flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors"
                >
                  <Instagram size={20} />
                </a>
              )}
              {settings?.social_media?.facebook && (
                <a
                  href={settings.social_media.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-white/80 text-white flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors"
                >
                  <Facebook size={20} />
                </a>
              )}
              {settings?.social_media?.youtube && (
                <a
                  href={settings.social_media.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-white/80 text-white flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors"
                >
                  <Youtube size={20} />
                </a>
              )}
              {settings?.social_media?.whatsapp_link && (
                <a
                  href={settings.social_media.whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-white/80 text-white flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground transition-colors"
                >
                  <MessageCircle size={20} />
                </a>
              )}
            </div>
          </div>

          {/* Links */}
          <div>
            <h5 className="font-display text-lg text-secondary mb-4">
              <Element
                id={`${nodeId}_nav_title`}
                is={EditableText}
                tag="span"
                className=""
                content="Navegação"
              />
            </h5>
            <ul className="space-y-3 font-body text-sm">
              <li>
                <Link href="/produtos" className="text-secondary/70 hover:text-primary transition-colors">
                  Todos os Produtos
                </Link>
              </li>
              <li>
                <Link href="/produtos?filter=new" className="text-secondary/70 hover:text-primary transition-colors">
                  Novidades
                </Link>
              </li>
              <li>
                <Link href="/produtos?filter=bestseller" className="text-secondary/70 hover:text-primary transition-colors">
                  Mais Vendidos
                </Link>
              </li>
              <li>
                <Link href="/sobre" className="text-secondary/70 hover:text-primary transition-colors">
                  Sobre Nós
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h5 className="font-display text-lg text-secondary mb-4">
              <Element
                id={`${nodeId}_help_title`}
                is={EditableText}
                tag="span"
                className=""
                content="Ajuda"
              />
            </h5>
            <ul className="space-y-3 font-body text-sm">
              <li>
                <Link href="/politica-troca" className="text-secondary/70 hover:text-primary transition-colors">
                  Política de Troca
                </Link>
              </li>
              <li>
                <Link href="/frete" className="text-secondary/70 hover:text-primary transition-colors">
                  Frete e Entregas
                </Link>
              </li>
              <li>
                <Link href="/guia-tamanhos" className="text-secondary/70 hover:text-primary transition-colors">
                  Guia de Tamanhos
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-secondary/70 hover:text-primary transition-colors">
                  Perguntas Frequentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h5 className="font-display text-lg text-secondary mb-4">
              <Element
                id={`${nodeId}_contact_title`}
                is={EditableText}
                tag="span"
                className=""
                content="Contato"
              />
            </h5>
            <ul className="space-y-4 font-body text-sm">
              {settings?.address && (
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-secondary/70">
                    {settings.address}
                  </span>
                </li>
              )}
              {settings?.whatsapp && (
                <li className="flex items-center gap-3">
                  <Phone size={18} className="text-primary flex-shrink-0" />
                  <a href={`tel:${settings.whatsapp}`} className="text-secondary/70 hover:text-primary transition-colors">
                    {settings.whatsapp}
                  </a>
                </li>
              )}
              {settings?.email && (
                <li className="flex items-center gap-3">
                  <Mail size={18} className="text-primary flex-shrink-0" />
                  <a href={`mailto:${settings.email}`} className="text-secondary/70 hover:text-primary transition-colors">
                    {settings.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-secondary/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-secondary/50 text-xs font-body">
              © {new Date().getFullYear()} {settings?.name || "Loja"}. Todos os direitos reservados.
            </p>
            {settings?.cnpj_cpf && (
              <p className="text-secondary/30 text-[10px] font-body">
                CNPJ/CPF: {settings.cnpj_cpf}
              </p>
            )}
          </div>
          <div className="flex gap-6">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" alt="Visa" className="h-6 opacity-50 hover:opacity-100 transition-opacity" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" alt="Mastercard" className="h-6 opacity-50 hover:opacity-100 transition-opacity" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/200px-PayPal.svg.png" alt="PayPal" className="h-6 opacity-50 hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </footer>
  );
}

Footer.craft = {
  displayName: 'Footer',
  props: {},
  isCanvas: true,
  rules: {
    canMoveIn: () => false,
    canMoveOut: () => false,
  },
}
