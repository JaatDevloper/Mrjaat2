import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage.js";
import { insertPostSchema } from "../shared/schema.js";
import { z } from "zod";
import { Auth } from "./mongodb.js";
import path from "path";
import express from "express";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Serve uploads directory
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

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

  // Upload routes
  app.post("/api/uploads/request-url", authMiddleware, async (req, res) => {
    try {
      const { name, contentType } = req.body;
      const fileName = `${Date.now()}-${name}`;
      // In this local implementation, we'll just return a local upload URL
      // Since we don't have S3, we'll use a local endpoint that handles the PUT
      const protocol = req.secure ? "https" : "http";
      const host = req.get("host");
      const uploadURL = `${protocol}://${host}/api/uploads/direct/${fileName}`;
      
      res.json({
        uploadURL,
        objectPath: `/uploads/${fileName}`,
        metadata: {
          name,
          contentType: contentType || "application/octet-stream"
        }
      });
    } catch (err) {
      console.error("Upload request error:", err);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  app.put("/api/uploads/direct/:filename", async (req, res) => {
    try {
      const uploadDir = path.join(process.cwd(), "uploads");
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, req.params.filename);
      const writeStream = (await import("fs")).createWriteStream(filePath);
      req.pipe(writeStream);
      writeStream.on("finish", () => {
        res.json({ success: true });
      });
      writeStream.on("error", (err) => {
        console.error("Write stream error:", err);
        res.status(500).json({ message: "Upload failed" });
      });
    } catch (err) {
      console.error("Direct upload error:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  return httpServer;
}

import fs from "fs/promises";
