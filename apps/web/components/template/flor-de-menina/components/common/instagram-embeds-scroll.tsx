'use client'

import React, { useEffect } from 'react';
import { motion } from "framer-motion";

// --- Types ---
interface InstagramEmbed {
  html: string;
}

interface InstagramEmbedsScrollProps {
  embeds: string[]; // Array de HTML dos embeds
  className?: string;
}

// --- Sub-Components ---
const InstagramEmbedsColumn = (props: {
  className?: string;
  embeds: string[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-transparent transition-colors duration-300"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.embeds.map((embedHtml, i) => (
                <motion.div
                  key={`${index}-${i}`}
                  aria-hidden={index === 1 ? "true" : "false"}
                  tabIndex={index === 1 ? -1 : 0}
                  whileHover={{
                    scale: 1.03,
                    y: -8,
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                    transition: { type: "spring", stiffness: 400, damping: 17 }
                  }}
                  whileFocus={{
                    scale: 1.03,
                    y: -8,
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                    transition: { type: "spring", stiffness: 400, damping: 17 }
                  }}
                  className="rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-lg shadow-black/5 max-w-xs w-full bg-white dark:bg-neutral-900 transition-all duration-300 cursor-default select-none group focus:outline-none focus:ring-2 focus:ring-primary/30 overflow-hidden instagram-embed-container"
                  style={{ maxWidth: '100%', minWidth: 0 }}
                >
                  <div
                    className="w-full"
                    style={{ maxWidth: '100%', overflow: 'hidden' }}
                    dangerouslySetInnerHTML={{ __html: embedHtml }}
                  />
                </motion.div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};

// --- Main Component ---
export function InstagramEmbedsScroll({ embeds, className }: InstagramEmbedsScrollProps) {
  // Processar embeds quando o componente montar ou quando os embeds mudarem
  useEffect(() => {
    if (embeds.length > 0 && typeof window !== 'undefined') {
      const processEmbeds = () => {
        if (window.instgrm && window.instgrm.Embeds) {
          window.instgrm.Embeds.process();
        } else {
          setTimeout(processEmbeds, 200);
        }
      };

      const timer = setTimeout(processEmbeds, 300);
      return () => clearTimeout(timer);
    }
  }, [embeds]);

  if (embeds.length === 0) {
    return null;
  }

  // Dividir embeds em colunas (máximo 3)
  const firstColumn = embeds.slice(0, Math.ceil(embeds.length / 3));
  const secondColumn = embeds.slice(Math.ceil(embeds.length / 3), Math.ceil(embeds.length / 3) * 2);
  const thirdColumn = embeds.slice(Math.ceil(embeds.length / 3) * 2);

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{
          duration: 1.2,
          ease: [0.16, 1, 0.3, 1],
          opacity: { duration: 0.8 }
        }}
        className="w-full"
      >
        <div
          className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[740px] overflow-hidden"
          role="region"
          aria-label="Scrolling Instagram Embeds"
        >
          {firstColumn.length > 0 && (
            <InstagramEmbedsColumn embeds={firstColumn} duration={15} />
          )}
          {secondColumn.length > 0 && (
            <InstagramEmbedsColumn
              embeds={secondColumn}
              className="hidden md:block"
              duration={19}
            />
          )}
          {thirdColumn.length > 0 && (
            <InstagramEmbedsColumn
              embeds={thirdColumn}
              className="hidden lg:block"
              duration={17}
            />
          )}
        </div>
      </motion.div>
      <style jsx>{`
        .instagram-embed-container {
          max-width: 100%;
          overflow: hidden;
        }
        
        .instagram-embed-container :global(blockquote.instagram-media) {
          max-width: 100% !important;
          min-width: 0 !important;
          width: 100% !important;
        }
        
        @media (max-width: 1024px) {
          .instagram-embed-container :global(blockquote.instagram-media) {
            min-width: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

// Declaração global para TypeScript
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

