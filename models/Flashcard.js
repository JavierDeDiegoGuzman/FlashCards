import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const flashcardSchema = new mongoose.Schema(
  {
    deckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deck",
      required: true,
    },
    front: {
      type: String,
      required: true,
      trim: true,
    },
    back: {
      type: String,
      required: true,
      trim: true,
    },
    wrongOptions: {
      type: [String],
      required: true,
      validate: {
        validator: function(array) {
          return array.length === 2;
        },
        message: 'Debe proporcionar exactamente 2 opciones incorrectas'
      }
    }
  },
  {
    timestamps: true,
  }
);

// Añade el plugin toJSON
flashcardSchema.plugin(toJSON);

// Añade un índice compuesto para optimizar las búsquedas por deckId
flashcardSchema.index({ deckId: 1 });

const Flashcard = mongoose.models.Flashcard || mongoose.model("Flashcard", flashcardSchema);

export default Flashcard; 