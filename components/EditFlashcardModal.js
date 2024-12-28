"use client";
import { useState, useEffect } from 'react';
import Modal from './Modal';

export default function EditFlashcardModal({ 
  show, 
  onClose, 
  flashcard, 
  onUpdate,
  deckId 
}) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [wrongOption1, setWrongOption1] = useState('');
  const [wrongOption2, setWrongOption2] = useState('');

  useEffect(() => {
    if (flashcard && show) {
      setFront(flashcard.front);
      setBack(flashcard.back);
      setWrongOption1(flashcard.wrongOptions[0]);
      setWrongOption2(flashcard.wrongOptions[1]);
    }
  }, [flashcard, show]);

  const handleTab = (e, setValue) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const value = e.target.value;
      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      setValue(newValue);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `/api/decks/${deckId}/flashcards/${flashcard._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            front,
            back,
            wrongOptions: [wrongOption1, wrongOption2]
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al actualizar la tarjeta');
      }

      const data = await response.json();
      onUpdate(data.data);
      onClose();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Modal
      show={show}
      onClose={onClose}
      title="Editar Tarjeta"
    >
      <form onSubmit={handleEdit} className="space-y-8">
        <div>
          <label htmlFor="front" className="block text-lg font-medium text-gray-700 mb-3">
            Pregunta
          </label>
          <textarea
            id="front"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            onKeyDown={(e) => handleTab(e, setFront)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[200px] text-lg p-4"
            rows={8}
          />
        </div>
        <div>
          <label htmlFor="back" className="block text-lg font-medium text-gray-700 mb-3">
            Respuesta
          </label>
          <textarea
            id="back"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            onKeyDown={(e) => handleTab(e, setBack)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[200px] text-lg p-4"
            rows={8}
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
          />
        </div>
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
} 