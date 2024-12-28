import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { NextResponse } from "next/server";

export function authMiddleware(handler) {
  return async (request, context) => {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session) {
        return NextResponse.json(
          { error: "No autorizado" },
          { status: 401 }
        );
      }

      request.user = {
        id: session.user.id,
        email: session.user.email
      };
      
      return handler(request, context);
    } catch (error) {
      console.error("Auth Middleware Error:", error);
      return NextResponse.json(
        { error: "Error de autenticación" },
        { status: 500 }
      );
    }
  };
} 