import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },

    // NEW FIELD
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    cards: [
      {
        question: {
          type: String,
          required: true,
        },

        answer: {
          type: String,
          required: true,
        },

        difficulty: {
          type: String,
          enum: ["easy", "medium", "hard"],
          default: "medium",
        },

        lastReview: {
          type: Date,
          default: null,
        },

        reviewCount: {
          type: Number,
          default: 0,
        },

        isStarred: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

flashcardSchema.index({ userId: 1, documentId: 1 });

const Flashcard = mongoose.model("Flashcard", flashcardSchema);

export default Flashcard;