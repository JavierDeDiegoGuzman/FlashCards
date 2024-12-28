'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PublicDeckList() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDecks() {
      try {
        const response = await fetch('/api/decks?public=true');
        if (!response.ok) {
          throw new Error('Error al cargar los mazos');
        }
        const data = await response.json();
        setDecks(data.data || []);
      } catch (error) {
        console.error('Error loading decks:', error);
        setDecks([]);
      } finally {
        setLoading(false);
      }
    }

    loadDecks();
  }, []);

  if (loading) return <div>Cargando mazos...</div>;

  if (!decks.length) return <div>No hay mazos disponibles.</div>;

  return (
    <div className="grid gap-4">
      {decks.map((deck) => (
        <Link
          key={deck._id}
          href={`/deck/${deck._id}`}
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h3 className="text-xl font-semibold mb-2">{deck.name}</h3>
          <p className="text-gray-600">
            {deck.flashcardCount} {deck.flashcardCount === 1 ? 'tarjeta' : 'tarjetas'}
          </p>
        </Link>
      ))}
    </div>
  );
} 