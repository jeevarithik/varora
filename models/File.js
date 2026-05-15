import mongoose from "mongoose";

const FileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    name: String,

    content: String,

    type: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.File ||
  mongoose.model("File", FileSchema);