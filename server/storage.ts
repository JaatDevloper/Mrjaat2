import { Content } from "./mongodb.js";
import { type Post, type InsertPost } from "../shared/schema.js";
import fs from "fs/promises";
import path from "path";

export interface IStorage {
  getPosts(): Promise<Post[]>;
  getPost(id: string): Promise<Post | null>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, post: Partial<InsertPost>): Promise<Post | null>;
  deletePost(id: string): Promise<boolean>;
  saveFile(name: string, contentType: string, buffer: Buffer): Promise<string>;
}

export class MongoStorage implements IStorage {
  private uploadDir = path.join(process.cwd(), "uploads");

  constructor() {
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (err) {
      console.error("Error creating upload directory:", err);
    }
  }

  async getPosts(): Promise<Post[]> {
    const docs = await Content.find().sort({ createdAt: -1 });
    return docs.map(doc => this.mapDoc(doc));
  }

  async getPost(id: string): Promise<Post | null> {
    const doc = await Content.findById(id);
    return doc ? this.mapDoc(doc) : null;
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const { authKey, ...postData } = insertPost;
    const doc = await Content.create(postData);
    return this.mapDoc(doc);
  }

  async updatePost(id: string, update: Partial<InsertPost>): Promise<Post | null> {
    const doc = await Content.findByIdAndUpdate(id, update, { new: true });
    return doc ? this.mapDoc(doc) : null;
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await Content.findByIdAndDelete(id);
    return !!result;
  }

  async saveFile(name: string, contentType: string, buffer: Buffer): Promise<string> {
    const fileName = `${Date.now()}-${name}`;
    const filePath = path.join(this.uploadDir, fileName);
    await fs.writeFile(filePath, buffer);
    return `/uploads/${fileName}`;
  }

  private mapDoc(doc: any): Post {
    return {
      id: doc._id.toString() as any, // Cast to any because schema expects number but MongoDB uses string IDs
      title: doc.title,
      description: doc.description,
      thumbnail: doc.thumbnail,
      content: doc.content,
      createdAt: doc.createdAt,
    };
  }
}

export const storage = new MongoStorage();
