import { useState } from 'react';

interface Conversation {
  conversationId: string;
  // Puedes agregar más propiedades si tu backend las manda (lastMessage, etc.)
}

interface ConversationListProps {
  conversations: Conversation[];
  onConversationSelect: (id: string) => void;
  // 👇 1. AGREGAMOS ESTA PROPIEDAD
  // Esto permite que el padre le diga a la lista cuál está seleccionado
  selectedId: string | null; 
  onSearch: (searchTerm: string) => void;
  onClearSearch: () => void;
  isSearching: boolean;
}

export function ConversationList({ 
  conversations, 
  onConversationSelect, 
  selectedId, // 👈 2. Recibimos el valor del padre
  onSearch,
  onClearSearch,
  isSearching
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // ❌ BORRAMOS ESTE ESTADO INTERNO
  // const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    // Ya no seteamos estado local, solo avisamos al padre
    onConversationSelect(id);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };
  
  const handleClearClick = () => {
    setSearchTerm('');
    onClearSearch();
  };

  return (
    <div className="border-r border-gray-200 h-full flex flex-col bg-white">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-700">Chats</h2>
        {/* --- FORMULARIO DE BÚSQUEDA --- */}
        <form onSubmit={handleSearchSubmit} className="mt-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por teléfono..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex space-x-2 mt-2">
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-1 rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              Buscar
            </button>
            {isSearching && (
              <button 
                type="button"
                onClick={handleClearClick}
                className="w-full bg-gray-500 text-white py-1 rounded-md text-sm hover:bg-gray-600 transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        </form>
      </div>

      <ul className="overflow-y-auto flex-grow">
        {conversations.length > 0 ? (
          conversations.map(({ conversationId }) => {
            // 3. Usamos la prop 'selectedId' (que viene del padre) para decidir el color
            const isSelected = selectedId === conversationId;
            
            return (
              <li
                key={conversationId}
                onClick={() => handleSelect(conversationId)}
                className={`p-4 cursor-pointer transition-colors border-l-4 ${
                  isSelected 
                    ? 'bg-blue-50 border-blue-500' // Estilo activo
                    : 'hover:bg-gray-50 border-transparent' // Estilo inactivo
                }`}
              >
                <div className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                    {conversationId}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                    Clic para ver chat
                </div>
              </li>
            );
          })
        ) : (
          <li className="p-8 text-center text-gray-500">
            {isSearching ? "No se encontró la conversación." : "No hay conversaciones activas."}
          </li>
        )}
      </ul>
    </div>
  );
}