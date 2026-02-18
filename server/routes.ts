import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage.js";
import { insertPostSchema } from "../shared/schema.js";
import { z } from "zod";
import { Auth } from "./mongodb.js";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize admin key if not exists
  const ADMIN_KEY = "A9x7QpL2#vT8mZr5KjW4";
  Auth.findOne({ key: ADMIN_KEY }).then(exists => {
    if (!exists) {
      Auth.create({ key: ADMIN_KEY }).then(() => console.log("Admin key initialized in MongoDB")).catch(err => console.error("Error initializing admin key:", err));
    }
  });

  const authMiddleware = async (req: any, res: any, next: any) => {
    const authKey = req.body.authKey || req.headers['x-auth-key'];
    
    try {
      const validKey = await Auth.findOne({ key: authKey });
      if (!validKey) {
        return res.status(401).json({ message: "Unauthorized: Invalid admin auth key." });
      }
      next();
    } catch (err) {
      console.error("Internal server error during auth:", err);
      res.status(500).json({ message: "Internal server error during auth: " + (err instanceof Error ? err.message : String(err)) });
    }
  };

  app.get("/api/posts", async (_req, res) => {
    const posts = await storage.getPosts();
    res.json(posts);
  });

  app.get("/api/posts/:id", async (req, res) => {
    const post = await storage.getPost(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  });

  app.post("/api/posts", authMiddleware, async (req, res) => {
    try {
      console.log("Create post request body:", JSON.stringify(req.body, null, 2));
      const postData = insertPostSchema.parse(req.body);
      const post = await storage.createPost(postData);
      res.status(201).json(post);
    } catch (err) {
      console.error("Create post error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error: " + (err instanceof Error ? err.message : String(err)) });
    }
  });

  app.put("/api/posts/:id", authMiddleware, async (req, res) => {
    try {
      const postData = insertPostSchema.partial().parse(req.body);
      const post = await storage.updatePost(req.params.id, postData);
      if (!post) return res.status(404).json({ message: "Post not found" });
      res.json(post);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/posts/:id", authMiddleware, async (req, res) => {
    const success = await storage.deletePost(req.params.id);
    if (!success) return res.status(404).json({ message: "Post not found" });
    res.json({ success: true });
  });

  return httpServer;
}
