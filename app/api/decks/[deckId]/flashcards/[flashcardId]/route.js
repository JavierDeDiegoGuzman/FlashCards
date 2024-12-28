import { authMiddleware } from "@/middleware/authMiddleware";
import { ApiResponse } from "@/utils/apiResponse";
import connectMongo from "@/libs/mongoose";
import Flashcard from "@/models/Flashcard";
import Deck from "@/models/Deck";

// GET /api/decks/[deckId]/flashcards/[flashcardId] - Obtener una flashcard específica
export const GET = authMiddleware(async (request, { params }) => {
  try {
    await connectMongo();
    
    // Verificar que el deck existe y pertenece al usuario
    const deck = await Deck.findOne({
      _id: params.deckId,
      userId: request.user.id
    });

    if (!deck) {
      return ApiResponse.error("Mazo no encontrado", 404);
    }

    const flashcard = await Flashcard.findOne({
      _id: params.flashcardId,
      deckId: params.deckId
    });

    if (!flashcard) {
      return ApiResponse.error("Tarjeta no encontrada", 404);
    }

    return ApiResponse.success(flashcard);
  } catch (error) {
    console.error("Error fetching flashcard:", error);
    return ApiResponse.error("Error al obtener la tarjeta", 500);
  }
});

// PUT /api/decks/[deckId]/flashcards/[flashcardId] - Actualizar una flashcard
export const PUT = authMiddleware(async (request, { params }) => {
  try {
    await connectMongo();
    
    const deck = await Deck.findOne({
      _id: params.deckId,
      userId: request.user.id
    });

    if (!deck) {
      return ApiResponse.error("Mazo no encontrado", 404);
    }

    const data = await request.json();
    
    // Validar que se proporcionan todos los campos necesarios
    if (!data.front || !data.back || !Array.isArray(data.wrongOptions) || data.wrongOptions.length !== 2) {
      return ApiResponse.error("Datos de flashcard inválidos", 400);
    }

    const flashcard = await Flashcard.findOneAndUpdate(
      {
        _id: params.flashcardId,
        deckId: params.deckId
      },
      {
        front: data.front,
        back: data.back,
        wrongOptions: data.wrongOptions
      },
      { new: true }
    );

    if (!flashcard) {
      return ApiResponse.error("Tarjeta no encontrada", 404);
    }

    return ApiResponse.success(flashcard);
  } catch (error) {
    console.error("Error updating flashcard:", error);
    return ApiResponse.error("Error al actualizar la tarjeta", 500);
  }
});

// DELETE /api/decks/[deckId]/flashcards/[flashcardId] - Eliminar una flashcard
export const DELETE = authMiddleware(async (request, { params }) => {
  try {
    await connectMongo();
    
    // Verificar que el deck existe y pertenece al usuario
    const deck = await Deck.findOne({
      _id: params.deckId,
      userId: request.user.id
    });

    if (!deck) {
      return ApiResponse.error("Mazo no encontrado", 404);
    }

    const flashcard = await Flashcard.findOneAndDelete({
      _id: params.flashcardId,
      deckId: params.deckId
    });

    if (!flashcard) {
      return ApiResponse.error("Tarjeta no encontrada", 404);
    }

    return ApiResponse.success({ message: "Tarjeta eliminada correctamente" });
  } catch (error) {
    console.error("Error deleting flashcard:", error);
    return ApiResponse.error("Error al eliminar la tarjeta", 500);
  }
}); 