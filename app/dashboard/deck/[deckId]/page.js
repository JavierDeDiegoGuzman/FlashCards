"use client";
import { useEffect, useState } from 'react';
import FlashcardList from "@/components/FlashcardList";
import CreateFlashcard from "@/components/CreateFlashcard";
import Link from "next/link";
import DeckOptionsMenu from "@/components/DeckOptionsMenu";
import ImportFlashcardsButton from "@/components/ImportFlashcardsButton";

export default function DeckPage({ params }) {
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDeckData = async () => {
    try {
      const [deckResponse, countResponse] = await Promise.all([
        fetch(`/api/decks/${params.deckId}`),
        fetch(`/api/decks/${params.deckId}/flashcards`)
      ]);

      if (!deckResponse.ok || !countResponse.ok) {
        throw new Error("Error al cargar los datos");
      }

      const deckData = await deckResponse.json();
      const cardsData = await countResponse.json();

      setDeck({
        ...deckData.data,
        cardCount: cardsData.data.length
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeckData();
  }, [params.deckId]);

  if (loading || !deck) {
    return (
      <main className="min-h-screen p-8 pb-24">
        <div className="max-w-xl mx-auto">
          Cargando...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl font-extrabold">{deck.name}</h1>
          <DeckOptionsMenu deck={{ id: params.deckId, name: deck.name }} />
          <div className="flex gap-4">
            <Link 
              href={`/deck/${params.deckId}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Estudiar
            </Link>
            <ImportFlashcardsButton 
              deckId={params.deckId} 
              onImport={fetchDeckData}
            />
            <CreateFlashcard deckId={params.deckId} onUpdate={fetchDeckData} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-2">Detalles del Mazo</h2>
          <p className="text-gray-600 mb-4">{deck.description}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Creado:</span>
              <span className="ml-2">{new Date(deck.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="font-medium">Total de tarjetas:</span>
              <span className="ml-2">{deck.cardCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Tarjetas</h2>
          <FlashcardList deckId={params.deckId} />
        </div>
      </section>
    </main>
  );
} 