"use client";
import { useEffect, useState } from 'react';
import FlashcardItem from './FlashcardItem';

export default function FlashcardList({ deckId, onListUpdate }) {
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFlashcards = async () => {
    try {
      const response = await fetch(`/api/decks/${deckId}/flashcards`);
      if (!response.ok) {
        throw new Error('Error al cargar las tarjetas');
      }
      const data = await response.json();
      setFlashcards(data.data || []);
      if (onListUpdate) {
        onListUpdate();
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlashcards();
  }, [deckId]);

  if (loading) return <div>Cargando tarjetas...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!flashcards.length) return <div>No hay tarjetas en este mazo.</div>;

  return (
    <div className="space-y-4">
      {flashcards.map((flashcard) => (
        <FlashcardItem 
          key={flashcard._id} 
          flashcard={flashcard}
          onUpdate={loadFlashcards}
        />
      ))}
    </div>
  );
} 