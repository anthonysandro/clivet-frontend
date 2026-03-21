'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
import useWebSocket from 'react-use-websocket';
import { ConversationList } from '@/components/ConversationList';
import { ChatWindow } from '@/components/ChatWindow';
import api from '@/api';

// --- TIPOS ---
export interface Message {
  sender: 'BOT' | 'CUSTOMER' | 'AGENT';
  content: string;
  timestamp: string;
  conversationId: string;
}

export interface Conversation {
  conversationId: string;
  lastMessage?: string;
  updatedAt?: string;
}

export default function ChatPage() { 
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // --- 🛠️ HELPER: TRADUCTOR DE DATOS ---
  // Convierte el formato de DynamoDB (PK) al formato del Frontend (conversationId)
  const formatConversations = (items: any[]): Conversation[] => {
    if (!Array.isArray(items)) return [];
    
    return items.map((item) => ({
      // Si viene PK ("CONVERSATION#123"), le quitamos el prefijo. 
      // Si ya viene como conversationId, lo dejamos igual.
      conversationId: item.PK ? item.PK.replace('CONVERSATION#', '') : item.conversationId,
      lastMessage: item.lastMessage,
      updatedAt: item.updatedAt,
    }));
  };

  // --- WEBSOCKET ---
  const websocketUrl = tenantId 
    ? `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}?tenantId=${tenantId}` 
    : null;

  const { lastJsonMessage } = useWebSocket(websocketUrl, {
    onOpen: () => console.log('[FRONTEND] WebSocket Conectado!'),
    shouldReconnect: () => true,
    share: true, 
  });

  // --- CARGAR CONVERSACIONES ---
  const fetchConversations = useCallback(async () => {
    if (!tenantId) return;
    try {
      const response = await api.get('/conversations');
      console.log("Raw API Response:", response.data); // Para debug
      
      // 👇 USAMOS EL TRADUCTOR AQUÍ
      const formatted = formatConversations(response.data);
      console.log("Datos formateados:", formatted);
      
      setConversations(formatted);
    } catch (error) {
      console.error("Error recargando conversaciones:", error);
    }
  }, [tenantId]);

  // --- EFECTO: MENSAJES ENTRANTES (WebSocket) ---
  useEffect(() => {
    if (lastJsonMessage) {
      const rawMessage = lastJsonMessage as any;
      console.log("Nuevo mensaje WS:", rawMessage);

      // Normalizamos el mensaje entrante si es necesario
      const newMessage: Message = {
          ...rawMessage,
          conversationId: rawMessage.conversationId || (rawMessage.PK ? rawMessage.PK.replace('CONVERSATION#', '') : '')
      };

      if (!isSearching) {
         fetchConversations();
      }

      if (newMessage.conversationId === selectedConversationId) {
        setMessages(prev => [...prev, newMessage]);
      }
    }
  }, [lastJsonMessage, selectedConversationId, isSearching, fetchConversations]);
  
  // --- EFECTO: CARGA INICIAL (Auth & Tenant) ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const attributes = await fetchUserAttributes();
        // Lógica de prioridad de Tenant ID
        const finalTenantId = attributes['custom:tenantId'] || process.env.NEXT_PUBLIC_TENANT_ID || attributes.sub || '';
        
        console.log("Tenant ID Final usado:", finalTenantId);
        setTenantId(finalTenantId);

        if (finalTenantId) {
            const response = await api.get('/conversations');
            // 👇 USAMOS EL TRADUCTOR TAMBIÉN AQUÍ
            setConversations(formatConversations(response.data));
        }
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // --- EFECTO: CARGAR MENSAJES ---
  useEffect(() => {
    if (!selectedConversationId || !tenantId) {
      setMessages([]);
      return;
    };

    const fetchMessages = async () => {
      try {
        const response = await api.get(`/conversations/${selectedConversationId}`);
        // Asumiendo que los mensajes ya vienen limpios o no usan PK compleja para mostrarse
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    fetchMessages();
  }, [selectedConversationId, tenantId]);

  // --- HANDLERS ---
  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim() || !tenantId) return;
    setIsSearching(true);
    try {
      const response = await api.get(`/conversations?search=${searchTerm.trim()}`);
      // 👇 USAMOS EL TRADUCTOR AQUÍ TAMBIÉN
      setConversations(formatConversations(response.data));
    } catch (error) {
      console.error("Error al buscar:", error);
      setConversations([]);
    }
  };

  const clearSearch = async () => {
    setIsSearching(false);
    await fetchConversations();
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId || !tenantId) return;
    
    const tempMessage: Message = {
      conversationId: selectedConversationId,
      timestamp: new Date().toISOString(),
      sender: 'AGENT',
      content,
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      await api.post(`/conversations/${selectedConversationId}/send`, { content });
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Cargando Chat...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <main className="grid grid-cols-4 flex-grow overflow-hidden h-full">
        <div className="col-span-1 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
          <ConversationList 
            conversations={conversations}
            onConversationSelect={setSelectedConversationId}
            selectedId={selectedConversationId}
            onSearch={handleSearch}
            onClearSearch={clearSearch}
            isSearching={isSearching}
          />
        </div>
        
        <div className="col-span-3 flex flex-col h-full overflow-hidden">
          {selectedConversationId ? (
             <ChatWindow 
                messages={messages} 
                onSendMessage={handleSendMessage} 
             />
          ) : (
             <div className="flex items-center justify-center h-full text-gray-400">
                Selecciona una conversación para comenzar
             </div>
          )}
        </div>
      </main>
    </div>
  );
}