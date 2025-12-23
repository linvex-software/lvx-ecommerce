'use client'

import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { WhatsAppModal } from "./WhatsAppModal";

export function WhatsAppButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {!isModalOpen && (
        <button
          data-whatsapp-button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-elevated hover:scale-110 transition-transform duration-300 group"
          aria-label="Contato via WhatsApp"
        >
          <MessageCircle size={28} className="text-white" />
          <span className="absolute right-full mr-3 bg-charcoal text-white text-sm px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-body">
            Fale conosco!
          </span>
        </button>
      )}

      <WhatsAppModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
