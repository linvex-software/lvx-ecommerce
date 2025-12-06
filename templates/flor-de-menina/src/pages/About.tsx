import { MapPin, Phone, Clock, Heart } from "lucide-react";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";

export default function About() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&h=800&fit=crop"
          alt="Nossa Loja"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-charcoal/50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-secondary">
            <h1 className="font-display text-4xl lg:text-6xl mb-4">Nossa História</h1>
            <p className="font-body text-lg text-secondary/80">Elegância que inspira</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Sobre Nós" }]} />
      </div>

      <div className="container mx-auto px-4 pb-16">
        {/* Story */}
        <div className="max-w-3xl mx-auto text-center py-16">
          <span className="text-primary text-xs tracking-[0.3em] uppercase font-body mb-4 block">
            Desde 2015
          </span>
          <h2 className="font-display text-3xl lg:text-4xl text-foreground mb-8">
            Flor de Menina
          </h2>
          <p className="text-muted-foreground font-body leading-relaxed mb-6">
            A Flor de Menina nasceu do sonho de criar uma marca que traduzisse a essência da mulher contemporânea: 
            elegante, sofisticada e autêntica. Localizada no coração de Maceió, nossa loja é um espaço pensado 
            para proporcionar uma experiência única de moda.
          </p>
          <p className="text-muted-foreground font-body leading-relaxed mb-6">
            Cada peça é cuidadosamente selecionada para oferecer qualidade, conforto e estilo. 
            Trabalhamos com tecidos premium e acabamentos impecáveis, porque acreditamos que 
            toda mulher merece se sentir especial.
          </p>
          <p className="text-muted-foreground font-body leading-relaxed">
            Nossa missão é vestir mulheres que valorizam o bom gosto e a exclusividade, 
            oferecendo peças que vão do casual ao sofisticado, sempre com o toque único da Flor de Menina.
          </p>
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-3 gap-8 py-16 border-t border-border">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="text-primary" size={28} />
            </div>
            <h3 className="font-display text-xl mb-3">Qualidade</h3>
            <p className="text-muted-foreground font-body text-sm">
              Selecionamos cada peça com carinho, priorizando tecidos nobres e acabamentos impecáveis.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-display text-2xl">✦</span>
            </div>
            <h3 className="font-display text-xl mb-3">Exclusividade</h3>
            <p className="text-muted-foreground font-body text-sm">
              Peças únicas e em quantidades limitadas para garantir que você se sinta especial.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-display text-2xl">♡</span>
            </div>
            <h3 className="font-display text-xl mb-3">Atendimento</h3>
            <p className="text-muted-foreground font-body text-sm">
              Nossa equipe está pronta para ajudar você a encontrar o look perfeito.
            </p>
          </div>
        </div>

        {/* Store Info */}
        <div className="grid lg:grid-cols-2 gap-12 py-16 border-t border-border">
          <div>
            <h2 className="font-display text-3xl mb-8">Visite Nossa Loja</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <MapPin className="text-primary flex-shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="font-body font-medium mb-1">Endereço</h4>
                  <p className="text-muted-foreground">
                    Rua Lorem ipsum, 123<br />
                    Brasil<br />
                    CEP 57035-000
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Phone className="text-primary flex-shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="font-body font-medium mb-1">Contato</h4>
                  <p className="text-muted-foreground">
                    WhatsApp: (82) 99999-9999<br />
                    E-mail: contato@flordemenina.com.br
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Clock className="text-primary flex-shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="font-body font-medium mb-1">Horário de Funcionamento</h4>
                  <p className="text-muted-foreground">
                    Segunda a Sexta: 9h às 19h<br />
                    Sábado: 9h às 17h<br />
                    Domingo: Fechado
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="aspect-video lg:aspect-auto bg-secondary overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&h=600&fit=crop"
              alt="Interior da loja"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Team */}
        <div className="py-16 border-t border-border">
          <div className="text-center mb-12">
            <span className="text-primary text-xs tracking-[0.3em] uppercase font-body mb-4 block">
              Nossa Equipe
            </span>
            <h2 className="font-display text-3xl lg:text-4xl">Quem Faz a Flor de Menina</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: "Maria Clara", role: "Fundadora & CEO", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop" },
              { name: "Ana Beatriz", role: "Gerente de Loja", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop" },
              { name: "Juliana", role: "Consultora de Moda", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop" },
              { name: "Camila", role: "Atendimento", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop" },
            ].map((member) => (
              <div key={member.name} className="text-center">
                <div className="aspect-[4/5] mb-4 overflow-hidden bg-secondary">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-display text-lg">{member.name}</h3>
                <p className="text-sm text-muted-foreground font-body">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
