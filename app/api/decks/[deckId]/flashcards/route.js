import { authMiddleware } from "@/middleware/authMiddleware";
import { ApiResponse } from "@/utils/apiResponse";
import connectMongo from "@/libs/mongoose";
import Flashcard from "@/models/Flashcard";
import Deck from "@/models/Deck";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";

// GET flashcards - Sin autenticación
export async function GET(request, context) {
  try {
    await connectMongo();

    // Log del deckId recibido
    console.log('🎯 DeckId solicitado:', context.params.deckId);

    // Obtener el deck y hacer populate del userId
    const deck = await Deck.findById(context.params.deckId);
    console.log('📦 Deck encontrado:', {
      deckId: deck._id,
      deckUserId: deck.userId,
    });
    
    if (!deck) {
      return ApiResponse.error("Mazo no encontrado", 404);
    }

    // Obtener el usuario de la request (si existe)
    let userId = null;
    try {
      const session = await getServerSession(authOptions);
      userId = session?.user?.id;
      console.log('👤 Usuario actual:', userId);
    } catch (error) {
      console.log('❌ No hay sesión disponible');
    }

    // Obtener las flashcards
    const flashcards = await Flashcard.find({
      deckId: context.params.deckId
    }).lean();

    // Log antes de añadir los campos adicionales
    console.log('🔍 Comprobación de permisos:', {
      deckUserId: deck.userId,
      currentUserId: userId,
      canEdit: userId ? deck.userId === userId : false
    });

    // Añadir los campos adicionales a cada flashcard
    const enhancedFlashcards = flashcards.map(flashcard => ({
      ...flashcard,
      canBeEdited: userId ? deck.userId === userId : false,
      deckId: deck._id
    }));

    // Log final de la primera flashcard como ejemplo
    if (enhancedFlashcards.length > 0) {
      console.log('📝 Ejemplo de flashcard procesada:', {
        id: enhancedFlashcards[0]._id,
        canBeEdited: enhancedFlashcards[0].canBeEdited,
        deckId: enhancedFlashcards[0].deckId
      });
    }

    return ApiResponse.success(enhancedFlashcards);
  } catch (error) {
    console.error("❌ Error loading flashcards:", error);
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