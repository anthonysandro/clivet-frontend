'use client';

import { useEffect, useState } from 'react';
import { signOut, fetchUserAttributes } from 'aws-amplify/auth';
import useWebSocket from 'react-use-websocket';
import { ConversationList } from '@/components/ConversationList';
import { ChatWindow } from '@/components/ChatWindow';
import api from '@/api';

// Definimos los tipos de datos para mayor claridad
interface Message {
  sender: 'BOT' | 'CUSTOMER' | 'AGENT';
  content: string;
  timestamp: string;
  conversationId: string;
}

interface Conversation {
  conversationId: string;
}

export default function DashboardPage() {
  const [email, setEmail] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- CORRECCIÓN CLAVE PARA WEBSOCKET ---
  // 1. Obtenemos la URL base desde las variables de entorno.
  const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || '';
  // 2. Construimos la URL final solo cuando ya tengamos el tenantId.
  // Si no hay tenantId, el hook recibirá 'null' y no intentará conectarse.
  const socketUrl = tenantId ? `${websocketUrl}?tenantId=${tenantId}` : null;

  const { lastJsonMessage } = useWebSocket(socketUrl, {
    onOpen: () => console.log('[FRONTEND] WebSocket Conectado!'),
    shouldReconnect: (closeEvent) => true,
  });

  // Efecto para manejar los nuevos mensajes que llegan del WebSocket
  useEffect(() => {
    if (lastJsonMessage) {
      const newMessage = lastJsonMessage as Message;
      
      if (!conversations.some(c => c.conversationId === newMessage.conversationId)) {
        setConversations(prev => [{ conversationId: newMessage.conversationId }, ...prev]);
      }
      
      if (newMessage.conversationId === selectedConversationId) {
        setMessages(prevMessages => [...prevMessages, newMessage]);
      }
    }
  }, [lastJsonMessage, selectedConversationId, conversations]);
  
  // Lógica de carga de datos inicial
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const attributes = await fetchUserAttributes();
        setEmail(attributes.email || '');
        setTenantId(attributes.sub || ''); // <-- El tenantId se establece aquí
        
        const response = await api.get('/conversations');
        setConversations(response.data);
        
      } catch (error) {
        window.location.href = '/login';
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Efecto para cargar los mensajes de un chat seleccionado
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    };
    const fetchMessages = async () => {
      try {
        const response = await api.get(`/conversations/${selectedConversationId}`);
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    fetchMessages();
  }, [selectedConversationId]);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Cargando sesión...</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="flex justify-between items-center p-4 bg-white border-b border-gray-300 shadow-sm">
        <h1 className="text-xl font-bold">CliVet Dashboard</h1>
        <div>
          <span>{email}</span>
          <button
            onClick={handleSignOut}
            className="ml-4 bg-red-500 text-white py-1 px-3 rounded-md text-sm hover:bg-red-600"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>
      
      <main className="grid grid-cols-4 flex-grow overflow-hidden">
        <div className="col-span-1 bg-white overflow-y-auto">
          <ConversationList 
            conversations={conversations}
            onConversationSelect={setSelectedConversationId} 
          />
        </div>
        <div className="col-span-3">
          <ChatWindow messages={messages} />
        </div>
      </main>
    </div>
  );
}

