import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import Deck from "@/models/Deck";
import Flashcard from "@/models/Flashcard";

export async function GET(request) {
  try {
    await connectMongo();
    
    const url = new URL(request.url);
    const isPublic = url.searchParams.get('public') === 'true';
    const session = await getServerSession(authOptions);

    // Si no hay sesión y no es una petición pública, devolver error
    if (!session && !isPublic) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener los decks según el contexto
    const query = isPublic ? {} : { userId: session.user.id };
    const decks = await Deck.find(query).lean();

    // Añadir información adicional a cada deck
    const decksWithData = await Promise.all(
      decks.map(async (deck) => {
        const count = await Flashcard.countDocuments({ deckId: deck._id });
        return {
          ...deck,
          flashcardCount: count,
          isOwner: session?.user?.id === deck.userId.toString()
        };
      })
    );

    return NextResponse.json({ data: decksWithData }, { status: 200 });

  } catch (error) {
    console.error("Error fetching decks:", error);
    return NextResponse.json(
      { error: "Error al obtener los mazos" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    await connectMongo();
    
    const data = await request.json();
    
    if (!data.name) {
      return NextResponse.json(
        { error: "El nombre es requerido" },
        { status: 400 }
      );
    }

    const deck = await Deck.create({
      name: data.name,
      userId: session.user.id,
    });

    return NextResponse.json({ data: deck }, { status: 201 });

  } catch (error) {
    console.error("Error creating deck:", error);
    return NextResponse.json(
      { error: "Error al crear el mazo" },
      { status: 500 }
    );
  }
} 