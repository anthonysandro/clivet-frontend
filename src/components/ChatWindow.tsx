'use client';

import { useState, useRef, useEffect } from 'react';

// El tipo de dato para cada mensaje
interface Message {
  sender: 'BOT' | 'CUSTOMER' | 'AGENT';
  content: string;
  timestamp: string;
}

// Las propiedades que el componente recibirá
interface ChatWindowProps {
  messages: Message[];
  // --- NUEVO ---
  // Una función para manejar el envío de un nuevo mensaje.
  // Será opcional, para que el formulario solo aparezca si se proporciona.
  onSendMessage?: (content: string) => void;
}

export function ChatWindow({ messages, onSendMessage }: ChatWindowProps) {
  // --- NUEVO ---
  // Estado para guardar el texto que el agente está escribiendo.
  const [newMessage, setNewMessage] = useState('');
  
  // Referencia al final de la lista de mensajes para el auto-scroll.
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Función para hacer scroll hacia el último mensaje.
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Cada vez que la lista de mensajes cambie, hacemos scroll.
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- NUEVO ---
  // Manejador del formulario de envío.
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Previene que la página se recargue
    if (newMessage.trim() && onSendMessage) {
      onSendMessage(newMessage.trim());
      setNewMessage(''); // Limpia el input después de enviar
    }
  };

  // Si no hay mensajes, muestra un placeholder.
  if (messages.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">Selecciona un chat para ver los mensajes.</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Lista de Mensajes */}
      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.sender === 'CUSTOMER' ? 'justify-start' : 'justify-end'}`}
          >
            <div 
              className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${
                msg.sender === 'CUSTOMER' 
                  ? 'bg-white border border-gray-200' 
                  : 'bg-blue-500 text-white'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className={`text-xs mt-1 text-right ${msg.sender === 'CUSTOMER' ? 'text-gray-400' : 'text-blue-200'}`}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {/* Elemento invisible al final de la lista para hacer el auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* --- NUEVO: Formulario de Envío --- */}
      {/* Solo se muestra si la función onSendMessage fue proporcionada */}
      {onSendMessage && (
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe tu respuesta..."
              className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
              disabled={!newMessage.trim()}
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

