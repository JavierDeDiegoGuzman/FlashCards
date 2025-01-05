'use client';

import { useState } from 'react';
import { Menu } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import Modal from './Modal';
import { useRouter } from 'next/navigation';

export default function DeckOptionsMenu({ deck, onDeckUpdate, isOwner = false, onEnterSelectionMode }) {
  const router = useRouter();
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [name, setName] = useState(deck.name);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/decks/${deck.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar el mazo');
      setIsDeleteOpen(false);
      if (onDeckUpdate) onDeckUpdate();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/decks/${deck.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error('Error al actualizar el mazo');
      setIsRenameOpen(false);
      if (onDeckUpdate) onDeckUpdate();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button className="p-2 hover:bg-gray-100 rounded-full">
          <EllipsisVerticalIcon className="h-5 w-5" />
        </Menu.Button>
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onEnterSelectionMode}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                >
                  Seleccionar
                </button>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => router.push(`/study/${deck.id}`)}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                >
                  Estudiar
                </button>
              )}
            </Menu.Item>

            {isOwner && (
              <>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => router.push(`/dashboard/deck/${deck.id}`)}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                    >
                      Editar tarjetas
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setIsRenameOpen(true)}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                    >
                      Cambiar nombre
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setIsDeleteOpen(true)}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } block px-4 py-2 text-sm text-red-600 w-full text-left`}
                    >
                      Eliminar
                    </button>
                  )}
                </Menu.Item>
              </>
            )}
          </div>
        </Menu.Items>
      </Menu>

      {isOwner && (
        <>
          <Modal
            show={isRenameOpen}
            onClose={() => setIsRenameOpen(false)}
            title="Cambiar nombre del mazo"
          >
            <form onSubmit={handleRename} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsRenameOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </Modal>

          <Modal
            show={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            title="Eliminar Mazo"
          >
            <div className="space-y-4">
              <p>¿Estás seguro de que quieres eliminar este mazo?</p>
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
      )}
    </>
  );
} 