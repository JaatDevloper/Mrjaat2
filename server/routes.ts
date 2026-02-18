import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage.js";
import { insertPostSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  const authMiddleware = (req: any, res: any, next: any) => {
    const authKey = req.body.authKey || req.headers['x-auth-key'];
    if (authKey !== process.env.ADMIN_AUTH_KEY) {
      return res.status(401).json({ message: "Unauthorized: Invalid admin auth key." });
    }
    next();
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
      const postData = insertPostSchema.parse(req.body);
      const post = await storage.createPost(postData);
      res.status(201).json(post);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
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
