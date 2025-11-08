import { MessageCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WhatsAppButton = () => {
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");

  useEffect(() => {
    loadWhatsAppNumber();
  }, []);

  const loadWhatsAppNumber = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('whatsapp_number')
        .single();

      if (error) throw error;
      if (data?.whatsapp_number) {
        setWhatsappNumber(data.whatsapp_number);
      }
    } catch (error) {
      console.error('Erro ao carregar número do WhatsApp:', error);
    }
  };

  const handleWhatsAppClick = () => {
    if (!whatsappNumber) {
      toast.error('Número do WhatsApp não configurado');
      return;
    }

    const message = "Olá! Gostaria de mais informações.";
    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  // Não mostrar o botão se não houver número configurado
  if (!whatsappNumber) {
    return null;
  }

  return (
    <Button
      onClick={handleWhatsAppClick}
      size="lg"
      className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all z-50 bg-[#25D366] hover:bg-[#25D366]/90"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="sr-only">WhatsApp</span>
    </Button>
  );
};

export default WhatsAppButton;
