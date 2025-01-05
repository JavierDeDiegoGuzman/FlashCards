"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import DeckOptionsMenu from './DeckOptionsMenu';
import { useRouter } from 'next/navigation';

export default function DeckList({ isPublic = false }) {
  const router = useRouter();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedDecks, setSelectedDecks] = useState(new Set());

  const loadDecks = async () => {
    try {
      const response = await fetch(`/api/decks${isPublic ? '?public=true' : ''}`);
      if (!response.ok) throw new Error('Error al cargar los mazos');
      const data = await response.json();
      setDecks(data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading decks:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecks();
  }, [isPublic]);

  const toggleDeckSelection = (deckId) => {
    const newSelection = new Set(selectedDecks);
    if (newSelection.has(deckId)) {
      newSelection.delete(deckId);
      // Si no quedan mazos seleccionados, salir del modo selección
      if (newSelection.size === 0) {
        setSelectionMode(false);
      }
    } else {
      newSelection.add(deckId);
    }
    setSelectedDecks(newSelection);
  };

  // Nueva función para iniciar selección con un mazo específico
  const startSelectionWithDeck = (deckId) => {
    setSelectionMode(true);
    setSelectedDecks(new Set([deckId]));
  };

  const handleStudySelected = () => {
    if (selectedDecks.size > 0) {
      const deckIds = Array.from(selectedDecks);
      // Si solo hay un mazo seleccionado, ir a la ruta individual
      if (deckIds.length === 1) {
        router.push(`/deck/${deckIds[0]}`);
      } else {
        // Si hay múltiples mazos, ir a la ruta de estudio múltiple
        const cleanDeckIds = deckIds
          .filter(id => id && typeof id === 'string')
          .map(id => encodeURIComponent(id));
        
        router.push(`/multiple?decks=${cleanDeckIds.join(',')}`);
      }
    }
  };

  if (loading) return <div>Cargando mazos...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!decks.length) return <div>No hay mazos disponibles.</div>;

  return (
    <div className="space-y-4">
      {/* Barra de acciones con botones de selección */}
      {selectionMode && (
        <div className="flex justify-between items-center">
          <span className="text-gray-600">
            {selectedDecks.size} {selectedDecks.size === 1 ? 'mazo seleccionado' : 'mazos seleccionados'}
          </span>
          <div className="space-x-2">
            {selectedDecks.size > 0 && (
              <button
                onClick={handleStudySelected}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Estudiar {selectedDecks.size === 1 ? 'mazo' : 'mazos'}
              </button>
            )}
            <button
              onClick={() => {
                setSelectionMode(false);
                setSelectedDecks(new Set());
              }}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Grid de mazos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map((deck) => (
          <div
            key={deck._id}
            className={`relative bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow
              ${selectionMode ? 'cursor-pointer' : ''}`}
            onClick={() => selectionMode && toggleDeckSelection(deck._id)}
          >
            {selectionMode && (
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={selectedDecks.has(deck._id)}
                  onChange={() => toggleDeckSelection(deck._id)}
                  className="h-5 w-5 rounded border-gray-300"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            
            {!selectionMode && (
              <div className="absolute top-2 right-2">
                <DeckOptionsMenu 
                  deck={{ 
                    id: deck._id, 
                    name: deck.name,
                    userId: deck.userId
                  }} 
                  onDeckUpdate={loadDecks}
                  isOwner={deck.isOwner}
                  onEnterSelectionMode={() => startSelectionWithDeck(deck._id)}
                />
              </div>
            )}

            {!selectionMode ? (
              <Link href={`/deck/${deck._id}`}>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{deck.name}</h3>
                  <p className="text-gray-600">
                    {deck.flashcardCount} {deck.flashcardCount === 1 ? 'tarjeta' : 'tarjetas'}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{deck.name}</h3>
                <p className="text-gray-600">
                  {deck.flashcardCount} {deck.flashcardCount === 1 ? 'tarjeta' : 'tarjetas'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 