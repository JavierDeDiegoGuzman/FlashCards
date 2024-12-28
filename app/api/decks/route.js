import { authMiddleware } from "@/middleware/authMiddleware";
import { ApiResponse } from "@/utils/apiResponse";
import connectMongo from "@/libs/mongoose";
import Deck from "@/models/Deck";
import Flashcard from "@/models/Flashcard";

// Cambia la forma de exportar las funciones
export async function GET(request) {
  try {
    await connectMongo();
    
    // Si la URL incluye ?public=true, no aplicamos el middleware de autenticación
    const url = new URL(request.url);
    const isPublic = url.searchParams.get('public') === 'true';
    
    if (isPublic) {
      // Para la vista pública, traemos todos los mazos
      const decks = await Deck.find().lean();
      
      const decksWithCount = await Promise.all(
        decks.map(async (deck) => {
          const count = await Flashcard.countDocuments({ deckId: deck._id });
          return {
            ...deck,
            flashcardCount: count
          };
        })
      );

      return ApiResponse.success(decksWithCount);
    }

    // Si no es público, aplicamos el middleware de autenticación como antes
    return authMiddleware(async (req) => {
      const decks = await Deck.find({ userId: req.user.id }).lean();
      
      const decksWithCount = await Promise.all(
        decks.map(async (deck) => {
          const count = await Flashcard.countDocuments({ deckId: deck._id });
          return {
            ...deck,
            flashcardCount: count
          };
        })
      );

      return ApiResponse.success(decksWithCount);
    })(request);
  } catch (error) {
    console.error("Error fetching decks:", error);
    return ApiResponse.error("Error al obtener los mazos", 500);
  }
}

export async function POST(request) {
  return authMiddleware(async (req) => {
    try {
      await connectMongo();
      
      const data = await req.json();
      
      const deck = await Deck.create({
        name: data.name,
        userId: req.user.id,
      });

      return ApiResponse.success(deck, 201);
    } catch (error) {
      console.error("Error creating deck:", error);
      return ApiResponse.error("Error al crear el mazo", 500);
    }
  })(request);
} 