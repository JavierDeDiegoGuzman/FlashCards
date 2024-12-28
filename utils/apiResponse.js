import { NextResponse } from "next/server";

export const ApiResponse = {
  success: (data, status = 200) => {
    return NextResponse.json({ data }, { status });
  },

  error: (message, status = 400) => {
    return NextResponse.json({ error: message }, { status });
  }
}; 