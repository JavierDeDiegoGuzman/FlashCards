"use client";
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import StudyMode from "@/components/StudyMode";

export default function PublicDeckPage({ params }) {
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        const response = await fetch(`/api/decks/${params.deckId}/flashcards`);
        if (!response.ok) {
          throw new Error('Error al cargar las tarjetas');
        }
        const data = await response.json();
        setFlashcards(data.data || []);
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcards();
  }, [params.deckId]);

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto text-center">
          Cargando...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto text-center text-red-600">
          Error: {error}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <StudyMode 
          initialFlashcards={flashcards} 
          deckId={params.deckId} 
          userId={session?.user?.id} 
        />
      </div>
    </main>
  );
} 