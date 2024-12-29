'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon, PencilIcon, EllipsisVerticalIcon, TrashIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import Modal from './Modal';
import EditFlashcardModal from './EditFlashcardModal';
import { useRouter } from 'next/navigation';
import { signIn } from "next-auth/react";

// Configuración del sistema de niveles
const LEVEL_CONFIG = {
  MIN_LEVEL: 1,
  MAX_LEVEL: 3,
  POSITIONS: {
    1: { min: 2, max: 4 },    // Nivel 1: posiciones 2-4
    2: { min: 5, max: 8 },    // Nivel 2: posiciones 5-8
    3: { min: 9, max: 12 }    // Nivel 3: posiciones 9-12
  }
};

// Función para actualizar el nivel
const updateLevel = (currentLevel, isCorrect) => {
  if (isCorrect) {
    return Math.min(currentLevel + 1, LEVEL_CONFIG.MAX_LEVEL);
  } else {
    return Math.max(currentLevel - 1, LEVEL_CONFIG.MIN_LEVEL);
  }
};

// Función para calcular la nueva posición
const calculateNewPosition = (level, isCorrect, queueSize) => {
  // Si está en el nivel máximo y acierta, retornar null para indicar que se retira
  if (level === LEVEL_CONFIG.MAX_LEVEL && isCorrect) {
    return null;
  }

  const positions = LEVEL_CONFIG.POSITIONS[level];
  const randomPosition = positions.min + 
    Math.floor(Math.random() * (positions.max - positions.min + 1));
  
  return Math.min(randomPosition, queueSize);
};

// Función auxiliar para desordenar un array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const STUDY_MODES = {
  INITIAL_LEARNING: {
    id: 'initial_learning',
    label: 'Modo Test',
    description: 'Aprende nuevo material respondiendo preguntas tipo test. Se te presentarán tres opciones y deberás seleccionar la correcta. Este modo es ideal para tu primer contacto con el material.'
  },
  REVIEW: {
    id: 'review',
    label: 'Modo Repaso',
    description: 'Repasa el material con tarjetas de memoria tradicionales. Lee la pregunta, piensa en la respuesta y voltea la tarjeta para comprobar. Evalúa honestamente si conocías la respuesta correcta. Este modo es perfecto para reforzar tu conocimiento.'
  }
};

const getStorageKey = (deckId) => {
  if (!deckId) return null;
  return `flashcards_study_state_${deckId}`;
};

const checkSavedSession = (deckId) => {
  try {
    const storageKey = getStorageKey(deckId);
    const savedState = localStorage.getItem(storageKey);
    
    if (!savedState) return null;
    
    const parsedState = JSON.parse(savedState);
    
    if (!parsedState.mode || 
        !Array.isArray(parsedState.queue) || 
        parsedState.queue.length === 0 || 
        !parsedState.cardStates) {
      return null;
    }
    
    return parsedState;
  } catch (error) {
    console.error('Error al verificar la sesión guardada:', error);
    return null;
  }
};

export default function StudyMode({ initialFlashcards, deckId, userId }) {
  const router = useRouter();
  const [mode, setMode] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [cardStates, setCardStates] = useState({});
  const [savedSession, setSavedSession] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [deckData, setDeckData] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [autoAdvanceTimeout, setAutoAdvanceTimeout] = useState(null);

  useEffect(() => {
    if (currentCard) {
      console.log('🔍 Tarjeta actual:', currentCard._id);
    }
  }, [currentCard]);

  const handleResponse = (isCorrect) => {
    if (!currentCard) return;

    console.log(`🎯 Resultado:`, isCorrect ? '✅ CORRECTO' : '❌ INCORRECTO');

    const currentState = cardStates[currentCard._id] || {
      level: LEVEL_CONFIG.MIN_LEVEL,
      lastReviewed: null
    };

    const newLevel = updateLevel(currentState.level, isCorrect);

    const newCardStates = {
      ...cardStates,
      [currentCard._id]: {
        level: newLevel,
        lastReviewed: new Date()
      }
    };

    const newQueue = queue.slice(1);
    
    const newPosition = calculateNewPosition(newLevel, isCorrect, newQueue.length);
    
    if (newPosition !== null) {
      newQueue.splice(newPosition, 0, currentCard);
    } else {
      setCompleted(completed + 1);
    }

    setCardStates(newCardStates);
    setQueue(newQueue);
    setCurrentCard(newQueue[0] || null);
    setIsFlipped(false);
  };

  const fetchUpdatedFlashcards = async () => {
    try {
      const response = await fetch(`/api/decks/${deckId}/flashcards`);
      if (!response.ok) {
        throw new Error('Error al obtener las tarjetas');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      return null;
    }
  };

  const syncWithServer = async (savedState) => {
    const serverFlashcards = await fetchUpdatedFlashcards();
    
    if (!serverFlashcards) {
      return null;
    }

    // Si no hay estado guardado, retornar null en lugar de crear uno nuevo
    if (!savedState) {
      return null;
    }

    const serverFlashcardsMap = new Map(
      serverFlashcards.map(card => [card._id, card])
    );

    const updatedQueue = savedState.queue.map(card => {
      const serverVersion = serverFlashcardsMap.get(card._id);
      return serverVersion || card;
    }).filter(card => serverFlashcardsMap.has(card._id));

    // Si después de la sincronización no quedan tarjetas, retornar null
    if (updatedQueue.length === 0) {
      return null;
    }

    const updatedCurrentCard = savedState.currentCard 
      ? (serverFlashcardsMap.get(savedState.currentCard._id) || savedState.currentCard)
      : null;

    const updatedCardStates = Object.entries(savedState.cardStates)
      .reduce((acc, [id, state]) => {
        if (serverFlashcardsMap.has(id)) {
          acc[id] = state;
        }
        return acc;
      }, {});

    return {
      ...savedState,
      queue: updatedQueue,
      currentCard: updatedCurrentCard,
      cardStates: updatedCardStates
    };
  };

  useEffect(() => {
    if (!deckId) return;

    const initializeStudyMode = async () => {
      const storageKey = getStorageKey(deckId);
      const savedState = localStorage.getItem(storageKey);
      
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          const syncedState = await syncWithServer(parsedState);
          
          // Solo establecer el estado si hay una sesión válida
          if (syncedState && syncedState.mode && syncedState.queue && syncedState.queue.length > 0) {
            setSavedSession(syncedState);
          } else {
            setSavedSession(null);
          }
        } catch (error) {
          setSavedSession(null);
        }
      } else {
        setSavedSession(null);
      }
    };

    initializeStudyMode();
  }, [deckId]);

  useEffect(() => {
    if (!deckId || !mode) return;

    const storageKey = getStorageKey(deckId);
    
    if (queue.length > 0 || currentCard) {
      const stateToSave = {
        mode,
        queue,
        currentCard,
        completed,
        cardStates,
        options: mode === STUDY_MODES.INITIAL_LEARNING.id ? options : null,
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
    }
  }, [mode, queue, currentCard, completed, cardStates, options, deckId]);

  const startStudySession = (selectedMode) => {
    if (deckId) {
      localStorage.removeItem(getStorageKey(deckId));
    }
    
    setMode(selectedMode);
    const shuffledCards = shuffleArray(initialFlashcards);
    setQueue(shuffledCards);
    setCurrentCard(shuffledCards[0]);
    setCompleted(0);
    setSavedSession(null);
    
    setCardStates(initialFlashcards.reduce((acc, card) => ({
      ...acc,
      [card._id]: {
        level: LEVEL_CONFIG.MIN_LEVEL,
        lastReviewed: null
      }
    }), {}));
  };

  const continueSavedSession = () => {
    if (!savedSession) return;
    
    setMode(savedSession.mode);
    setQueue(savedSession.queue);
    setCurrentCard(savedSession.currentCard || savedSession.queue[0]);
    setCompleted(savedSession.completed || 0);
    setCardStates(savedSession.cardStates || {});
    setIsFlipped(false);
  };

  const handleEditCard = async (updatedCard) => {
    try {
      const response = await fetch(`/api/decks/${deckId}/flashcards/${updatedCard._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          front: updatedCard.front,
          back: updatedCard.back,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la tarjeta');
      }

      const updatedFlashcards = queue.map(card => 
        card._id === updatedCard._id ? updatedCard : card
      );
      setQueue(updatedFlashcards);
      
      if (currentCard._id === updatedCard._id) {
        setCurrentCard(updatedCard);
      }
      
      setIsEditModalOpen(false);
      setEditingCard(null);
    } catch (error) {
    }
  };

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
        `/api/decks/${deckId}/flashcards/${currentCard._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ front, back }),
        }
      );

      if (!response.ok) {
        throw new Error('Error al actualizar la tarjeta');
      }

      const updatedCard = { ...currentCard, front, back };
      const updatedQueue = queue.map(card => 
        card._id === currentCard._id ? updatedCard : card
      );
      
      setQueue(updatedQueue);
      setCurrentCard(updatedCard);
      setIsEditOpen(false);
    } catch (error) {
    }
  };

  useEffect(() => {
    if (currentCard && isEditOpen) {
      setFront(currentCard.front);
      setBack(currentCard.back);
    }
  }, [currentCard, isEditOpen]);

  const handleUpdateCard = (updatedCard) => {
    const updatedQueue = queue.map(card => 
      card._id === updatedCard._id ? updatedCard : card
    );
    setQueue(updatedQueue);
    setCurrentCard(updatedCard);
  };

  useEffect(() => {
    const fetchDeckData = async () => {
      try {
        const response = await fetch(`/api/decks/${deckId}`);
        if (!response.ok) throw new Error('Error al obtener el deck');
        const data = await response.json();
        setDeckData(data.data);
      } catch (error) {
      }
    };

    fetchDeckData();
  }, [deckId]);

  const handleDelete = async () => {
    if (!currentCard) return;
    
    try {
      const response = await fetch(
        `/api/decks/${deckId}/flashcards/${currentCard._id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Error al eliminar la tarjeta');
      }

      const updatedQueue = queue.filter(card => card._id !== currentCard._id);
      setQueue(updatedQueue);
      setCurrentCard(updatedQueue[0] || null);
      setIsMenuOpen(false);
      setIsDeleteModalOpen(false);
    } catch (error) {
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);

  const generateOptions = (card) => {
    if (!card) return [];
    
    const allOptions = [
      card.back,
      ...(card.wrongOptions || [])
    ];
    
    return shuffleArray(allOptions);
  };

  useEffect(() => {
    if (currentCard && mode === STUDY_MODES.INITIAL_LEARNING.id) {
      setOptions(generateOptions(currentCard));
      setSelectedAnswer(null);
      setShowResult(false);
      setFeedback(null);
    }
  }, [currentCard, mode]);

  const handleOptionSelect = (option) => {
    if (showResult || !option) {
      return;
    }
    
    setSelectedAnswer(option);
    setShowResult(true);
    
    if (!currentCard?.back) {
      return;
    }
    
    const isCorrect = option === currentCard.back;
    
    setFeedback({
      correct: isCorrect,
      message: isCorrect 
        ? "¡Correcto! 🎉" 
        : `Incorrecto. La respuesta correcta es: ${currentCard.back}`,
    });

    const timeout = setTimeout(() => {
      handleResponse(isCorrect);
      
      setSelectedAnswer(null);
      setShowResult(false);
      setFeedback(null);
    }, 2500);
    
    setAutoAdvanceTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (autoAdvanceTimeout) {
        clearTimeout(autoAdvanceTimeout);
      }
    };
  }, [autoAdvanceTimeout]);

  if (!currentCard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h3 className="text-2xl font-bold mb-6">Selecciona el modo de estudio</h3>
        
        <div className="grid gap-4 max-w-md w-full mb-8">
          {savedSession && savedSession.queue.length > 0 && (
            <>
              <button
                onClick={continueSavedSession}
                className="p-4 rounded-lg border-2 border-green-500 bg-green-50 text-left transition-all hover:bg-green-100"
              >
                <h4 className="font-semibold text-lg mb-1">Continuar sesión anterior</h4>
                <p className="text-sm text-gray-600">
                  Modo: {savedSession.mode === STUDY_MODES.INITIAL_LEARNING.id ? 'Aprendizaje Inicial' : 'Repaso'}
                  {' • '}
                  Progreso: {savedSession.completed || 0} completadas
                  {' • '}
                  Quedan: {savedSession.queue?.length || 0} tarjetas
                </p>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">O comenzar nuevo modo</span>
                </div>
              </div>
            </>
          )}

          {Object.values(STUDY_MODES).map((studyMode) => (
            <button
              key={studyMode.id}
              onClick={() => startStudySession(studyMode.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all
                ${mode === studyMode.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
            >
              <h4 className="font-semibold text-lg mb-1">{studyMode.label}</h4>
              <p className="text-sm text-gray-600">{studyMode.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="w-full px-4 py-2 flex justify-between items-center bg-white/80 backdrop-blur-sm">
        <p className="text-gray-600">
          Quedan: {queue.length} tarjetas
        </p>
        <div className="flex items-center gap-4">
          <p className="text-gray-600">
            Completadas: {completed}
          </p>
            <div className="relative">
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
                userId && currentCard && deckData && deckData.userId === userId ? (
                  <div 
                    className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsEditOpen(true);
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
                ) : (
                  userId ? (
                  <div 
                    className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="py-2 px-4 text-sm text-gray-500">
                      Solo el creador puede editar este deck
                    </div>
                  </div> ):(
                  <div 
                    className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                        <button
                          onClick={() => signIn(undefined, { callbackUrl: window.location.href })}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                      >
                        Iniciar sesión
                      </button>
                  </div> 
                  )
                )
              )}
            </div>
        </div>
      </div>

      <div className="flex-1 flex p-4 overflow-y-auto">
        {currentCard ? (
          mode === STUDY_MODES.INITIAL_LEARNING.id ? (
            <div className="w-full space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="prose max-w-none">
                  <ReactMarkdown>{currentCard.front}</ReactMarkdown>
                </div>
              </div>
              
              <div className="space-y-4">
                {options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(option)}
                    disabled={showResult}
                    className={`w-full p-4 text-left rounded-lg transition-colors ${
                      showResult
                        ? option === currentCard.back
                          ? 'bg-green-100 border-green-500'
                          : 'bg-red-100 border-red-500'
                        : selectedAnswer === option
                        ? 'bg-blue-100 border-blue-500'
                        : 'bg-white hover:bg-gray-50'
                    } border-2`}
                  >
                    <div className="prose max-w-none">
                      <ReactMarkdown>{option}</ReactMarkdown>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className="w-full bg-white rounded-xl shadow-lg cursor-pointer p-6"
            >
              <div className="prose max-w-none">
                <ReactMarkdown>
                  {isFlipped ? currentCard.back : currentCard.front}
                </ReactMarkdown>
              </div>
            </div>
          )
        ) : (
          <div className="w-full flex items-center justify-center">
            <p className="text-gray-600">No hay tarjetas disponibles</p>
          </div>
        )}
      </div>

      {currentCard && mode === STUDY_MODES.REVIEW.id && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t">
          <div className="flex justify-center gap-4 items-center p-4 max-w-2xl mx-auto">
            {!isFlipped ? (
              <button
                onClick={() => setIsFlipped(true)}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Mostrar Respuesta
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleResponse(false)}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <XMarkIcon className="h-5 w-5" />
                  No la Sabía
                </button>
                <button
                  onClick={() => handleResponse(true)}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <CheckIcon className="h-5 w-5" />
                  La Sabía
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <EditFlashcardModal
        show={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        flashcard={currentCard}
        onUpdate={handleUpdateCard}
        deckId={deckId}
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