"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import DeckOptionsMenu from './DeckOptionsMenu';

export default function DeckList() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDecks = async () => {
    try {
      const response = await fetch('/api/decks');
      if (!response.ok) {
        throw new Error('Error al cargar los mazos');
      }
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
  }, []);

  if (loading) return <div>Cargando mazos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {decks.map((deck) => (
        <div
          key={deck._id}
          className="relative bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="absolute top-2 right-2">
            <DeckOptionsMenu deck={{ id: deck._id, name: deck.name }} onDeckUpdate={loadDecks} />
          </div>
          <Link href={`/dashboard/deck/${deck._id}`}>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{deck.name}</h3>
              <p className="text-gray-600">
                {deck.flashcardCount} {deck.flashcardCount === 1 ? 'tarjeta' : 'tarjetas'}
              </p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
} 