"use client";
import { useState } from "react";
import Modal from "./Modal";

export default function ImportFlashcardsButton({ deckId, onImport }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jsonText, setJsonText] = useState("");

  const processCards = async (cards) => {
    // Validar el formato del JSON
    if (!Array.isArray(cards)) {
      throw new Error("El contenido debe ser un array de tarjetas");
    }

    // Validar que cada tarjeta tiene todos los campos necesarios
    const invalidCards = cards.filter(
      card => !card.front || !card.back || !Array.isArray(card.wrongOptions) || card.wrongOptions.length !== 2
    );
    if (invalidCards.length > 0) {
      throw new Error("Todas las tarjetas deben tener 'front', 'back' y exactamente 2 'wrongOptions'");
    }

    setLoading(true);
    setError("");

    // Importar cada tarjeta
    for (const card of cards) {
      const response = await fetch(`/api/decks/${deckId}/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          front: card.front,
          back: card.back,
          wrongOptions: card.wrongOptions
        }),
      });

      if (!response.ok) {
        throw new Error("Error al importar algunas tarjetas");
      }
    }

    // Cerrar modal y actualizar la vista
    setIsOpen(false);
    if (onImport) onImport();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const cards = JSON.parse(text);
      await processCards(cards);
    } catch (error) {
      console.error("Error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      if (!jsonText.trim()) {
        throw new Error("Por favor, ingresa el JSON de las tarjetas");
      }
      const cards = JSON.parse(jsonText);
      await processCards(cards);
    } catch (error) {
      console.error("Error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        Importar Tarjetas
      </button>

      <Modal
        show={isOpen}
        onClose={() => {
          setIsOpen(false);
          setError("");
          setJsonText("");
        }}
        title="Importar Tarjetas"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecciona un archivo JSON o pega el contenido con el siguiente formato:
          </p>
          <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
{`[
  {
    "front": "¿Cuál es la capital de Francia?",
    "back": "París",
    "wrongOptions": [
      "Londres",
      "Madrid"
    ]
  },
  {
    "front": "¿Cuál es el planeta más grande del sistema solar?",
    "back": "Júpiter",
    "wrongOptions": [
      "Saturno",
      "Marte"
    ]
  }
]`}
          </pre>
          
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pegar JSON
              </label>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder="Pega aquí el JSON de las tarjetas..."
                className="w-full h-32 p-2 border rounded-md"
                disabled={loading}
              />
              <button
                onClick={handlePaste}
                disabled={loading || !jsonText.trim()}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Importar desde texto
              </button>
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                O sube un archivo
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setError("");
                setJsonText("");
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
          </div>

          {loading && (
            <p className="text-sm text-gray-600 text-center">
              Importando tarjetas...
            </p>
          )}
        </div>
      </Modal>
    </>
  );
} 