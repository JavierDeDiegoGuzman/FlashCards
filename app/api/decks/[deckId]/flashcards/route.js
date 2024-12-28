import { authMiddleware } from "@/middleware/authMiddleware";
import { ApiResponse } from "@/utils/apiResponse";
import connectMongo from "@/libs/mongoose";
import Flashcard from "@/models/Flashcard";
import Deck from "@/models/Deck";

// GET flashcards - Sin autenticación
export async function GET(request, context) {
  try {
    await connectMongo();

    // Verificar que el mazo existe
    const deck = await Deck.findById(context.params.deckId);
    
    if (!deck) {
      return ApiResponse.error("Mazo no encontrado", 404);
    }

    const flashcards = await Flashcard.find({
      deckId: context.params.deckId
    }).lean();

    return ApiResponse.success(flashcards);
  } catch (error) {
    console.error("Error loading flashcards:", error);
    return ApiResponse.error("Error al cargar las tarjetas", 500);
  }
}

// POST new flashcard - Mantiene la autenticación
export async function POST(request, context) {
  return authMiddleware(async (req) => {
    try {
      await connectMongo();
      
      // Verificar que el mazo existe y pertenece al usuario
      const deck = await Deck.findOne({
        _id: context.params.deckId,
        userId: req.user.id
      });

      if (!deck) {
        return ApiResponse.error("Mazo no encontrado", 404);
      }

      const data = await req.json();
      
      // Validar que se proporcionan todos los campos necesarios
      if (!data.front || !data.back || !Array.isArray(data.wrongOptions) || data.wrongOptions.length !== 2) {
        return ApiResponse.error("Datos de flashcard inválidos", 400);
      }

      const flashcard = await Flashcard.create({
        deckId: context.params.deckId,
        front: data.front,
        back: data.back,
        wrongOptions: data.wrongOptions
      });

      return ApiResponse.success(flashcard, 201);
    } catch (error) {
      console.error("Error creating flashcard:", error);
      return ApiResponse.error("Error al crear la tarjeta", 500);
    }
  })(request, context);
} 