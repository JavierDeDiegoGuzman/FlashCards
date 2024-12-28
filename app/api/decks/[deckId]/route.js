import { authMiddleware } from "@/middleware/authMiddleware";
import { ApiResponse } from "@/utils/apiResponse";
import connectMongo from "@/libs/mongoose";
import Deck from "@/models/Deck";
import Flashcard from "@/models/Flashcard";

// GET individual deck
export async function GET(request, context) {
  return authMiddleware(async (req) => {
    try {
      await connectMongo();
      
      const deck = await Deck.findOne({
        _id: context.params.deckId,
        userId: req.user.id
      });

      if (!deck) {
        return ApiResponse.error("Mazo no encontrado", 404);
      }

      return ApiResponse.success(deck);
    } catch (error) {
      console.error("Error fetching deck:", error);
      return ApiResponse.error("Error al obtener el mazo", 500);
    }
  })(request, context);
}

// PUT update deck
export async function PUT(request, context) {
  return authMiddleware(async (req) => {
    try {
      await connectMongo();
      
      const data = await req.json();
      
      const deck = await Deck.findOneAndUpdate(
        { _id: context.params.deckId, userId: req.user.id },
        { $set: data },
        { new: true }
      );

      if (!deck) {
        return ApiResponse.error("Mazo no encontrado", 404);
      }

      return ApiResponse.success(deck);
    } catch (error) {
      console.error("Error updating deck:", error);
      return ApiResponse.error("Error al actualizar el mazo", 500);
    }
  })(request, context);
}

// DELETE deck
export async function DELETE(request, context) {
  return authMiddleware(async (req) => {
    try {
      await connectMongo();
      
      const deck = await Deck.findOneAndDelete({
        _id: context.params.deckId,
        userId: req.user.id
      });

      if (!deck) {
        return ApiResponse.error("Mazo no encontrado", 404);
      }

      // También eliminamos todas las flashcards asociadas
      await Flashcard.deleteMany({ deckId: context.params.deckId });

      // Cambiamos el código 204 por 200 y enviamos una respuesta
      return ApiResponse.success({ message: "Mazo eliminado correctamente" }, 200);
    } catch (error) {
      console.error("Error deleting deck:", error);
      return ApiResponse.error("Error al eliminar el mazo", 500);
    }
  })(request, context);
} 