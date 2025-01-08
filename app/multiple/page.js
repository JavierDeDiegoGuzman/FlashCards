"use client";
import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import StudyMode from '@/components/StudyMode';

// Componente interno que usa useSearchParams
function MultipleStudyContent() {
  const searchParams = useSearchParams();
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const deckIds = useMemo(() => {
    const rawDeckIds = searchParams.get('decks');
    return rawDeckIds?.split(',').filter(id => id.trim()) || [];
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    const fetchAllFlashcards = async () => {
      if (!deckIds.length) return;

      try {
        setLoading(true);
        setError(null);

        const flashcardsPromises = deckIds.map(async deckId => {
          const response = await fetch(`/api/decks/${deckId}/flashcards`);
          if (!response.ok) {
            throw new Error(`Error al cargar el mazo ${deckId}`);
          }
          const data = await response.json();
          return (data.data || []).map(card => ({
            ...card,
            deckId
          }));
        });

        const results = await Promise.all(flashcardsPromises);
        const allFlashcards = results.flat();

        if (isMounted) {
          setFlashcards(allFlashcards);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading flashcards:', error);
          setError(error.message);
          setLoading(false);
        }
      }
    };

    fetchAllFlashcards();

    return () => {
      isMounted = false;
    };
  }, [deckIds]);

  if (!deckIds.length) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-red-600">No se han seleccionado mazos para estudiar.</p>
          <button 
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto text-center">
          <p>Cargando tarjetas...</p>
          <p className="text-sm text-gray-600">Cargando {deckIds.length} mazos</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </main>
    );
  }

  if (!flashcards.length) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-red-600">No se encontraron tarjetas en los mazos seleccionados.</p>
          <button 
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Volver
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <StudyMode 
          initialFlashcards={flashcards}
          mode="multiple"
          deckIds={deckIds}
        />
      </div>
    </main>
  );
}

// Componente principal envuelto en Suspense
export default function MultipleStudyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen p-8">
        <div className="max-w-3xl mx-auto text-center">
          <p>Cargando...</p>
        </div>
      </main>
    }>
      <MultipleStudyContent />
    </Suspense>
  );
} 