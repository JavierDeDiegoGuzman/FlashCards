import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

const deckSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

deckSchema.plugin(toJSON);

deckSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Deck = mongoose.models.Deck || mongoose.model("Deck", deckSchema);

export default Deck; 