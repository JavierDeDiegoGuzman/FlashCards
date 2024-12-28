"use client";
import { useState } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Modal from './Modal';
import EditFlashcardModal from './EditFlashcardModal';

export default function FlashcardItem({ flashcard, onUpdate }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleTab = (e, setValue) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const value = e.target.value;
      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      setValue(newValue);
      // Mover el cursor después de la indentación
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `/api/decks/${flashcard.deckId}/flashcards/${flashcard._id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Error al eliminar la tarjeta');
      }

      setIsDeleteOpen(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div 
            className="flex-grow cursor-pointer" 
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className="transition-all duration-300">
              {isFlipped ? (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Respuesta:</p>
                  <p className="text-gray-900">{flashcard.back}</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Pregunta:</p>
                  <p className="text-gray-900">{flashcard.front}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-2 ml-4">
            <button
              onClick={() => setIsEditOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <EditFlashcardModal
        show={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        flashcard={flashcard}
        onUpdate={onUpdate}
        deckId={flashcard.deckId}
      />

      {/* Modal de confirmación de eliminación */}
      <Modal
        show={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Eliminar Tarjeta"
      >
        <div className="space-y-4">
          <p>¿Estás seguro de que quieres eliminar esta tarjeta?</p>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
} 