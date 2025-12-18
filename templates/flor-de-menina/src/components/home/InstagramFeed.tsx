import { Instagram } from "lucide-react";

const instagramPosts = [
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&h=400&fit=crop",
];

export function InstagramFeed() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <a
            href="https://instagram.com/flordemeninaoficial"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 text-foreground hover:text-primary transition-colors group"
          >
            <Instagram size={24} />
            <span className="font-display text-2xl lg:text-3xl">@flordemeninaoficial</span>
          </a>
          <p className="text-muted-foreground font-body text-sm mt-2">
            Siga-nos para mais inspiração
          </p>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {instagramPosts.map((post, index) => (
            <a
              key={index}
              href="https://instagram.com/flordemeninaoficial"
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square overflow-hidden group"
            >
              <img
                src={post}
                alt={`Instagram post ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/30 transition-colors flex items-center justify-center">
                <Instagram
                  size={24}
                  className="text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
