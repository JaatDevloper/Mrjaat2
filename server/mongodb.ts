import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  // We will handle this gracefully in the app, but for initialization:
  console.warn("MONGODB_URI is not defined. MongoDB connection will fail.");
} else {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));
}

const contentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'content', strict: false });

const authSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

export const Content = mongoose.model("Content", contentSchema, "content");
export const Auth = mongoose.model("Auth", authSchema, "auth");
