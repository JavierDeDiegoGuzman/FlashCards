"use client";
import { useState } from 'react';
import Modal from './Modal';

export default function CreateFlashcard({ deckId, onUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [wrongOption1, setWrongOption1] = useState('');
  const [wrongOption2, setWrongOption2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setFront('');
    setBack('');
    setWrongOption1('');
    setWrongOption2('');
    setError('');
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/decks/${deckId}/flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          front,
          back,
          wrongOptions: [wrongOption1, wrongOption2]
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear la tarjeta');
      }

      handleClose();
      if (onUpdate) onUpdate();
      if (window.refreshFlashcardList) window.refreshFlashcardList();
    } catch (error) {
      console.error('Error:', error);
      setError('Error al crear la tarjeta. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Crear Tarjeta
      </button>

      <Modal
        show={isOpen}
        onClose={handleClose}
        title="Crear Nueva Tarjeta"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pregunta (Frente)
            </label>
            <textarea
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
              rows={3}
              placeholder="Escribe la pregunta..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Respuesta Correcta (Reverso)
            </label>
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
              rows={2}
              placeholder="Escribe la respuesta correcta..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opción Incorrecta 1
            </label>
            <textarea
              value={wrongOption1}
              onChange={(e) => setWrongOption1(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
              rows={2}
              placeholder="Escribe una opción incorrecta..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opción Incorrecta 2
            </label>
            <textarea
              value={wrongOption2}
              onChange={(e) => setWrongOption2(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
              rows={2}
              placeholder="Escribe otra opción incorrecta..."
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
} 