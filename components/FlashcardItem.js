"use client";
import { useState } from 'react';
import { PencilIcon, TrashIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import EditFlashcardModal from './EditFlashcardModal';
import Modal from './Modal';

export default function FlashcardItem({ flashcard, onUpdate }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

      onUpdate();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex justify-between items-start mb-4">
        <div 
          className="flex-1 cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="prose max-w-none">
            <ReactMarkdown>
              {isFlipped ? flashcard.back : flashcard.front}
            </ReactMarkdown>
          </div>
        </div>

        {flashcard.canBeEdited && (
          <div className="relative ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-2 text-gray-600 hover:text-blue-600 rounded-full hover:bg-gray-100"
            >
              <EllipsisVerticalIcon className="h-5 w-5" />
            </button>

            {isMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsEditModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                  >
                    <PencilIcon className="h-4 w-4 mr-3" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      setIsDeleteModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
                  >
                    <TrashIcon className="h-4 w-4 mr-3" />
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <EditFlashcardModal
        show={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        flashcard={flashcard}
        onUpdate={onUpdate}
      />

      <Modal
        show={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar eliminación"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            ¿Estás seguro de que quieres eliminar esta tarjeta? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 