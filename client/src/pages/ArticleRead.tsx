import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Navigation } from "@/components/Navigation";
import { type Post } from "@shared/schema";
import { Loader2, ArrowLeft, Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function ArticleRead() {
  const { id } = useParams();

  const { data: post, isLoading, error } = useQuery<Post>({
    queryKey: [`/api/posts/${id}`],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
        <h1 className="text-4xl font-display font-bold mb-4">Post Not Found</h1>
        <Link href="/">
          <a className="text-primary hover:underline flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </a>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/">
            <a className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to Archive
            </a>
          </Link>

          <div className="relative aspect-video rounded-2xl overflow-hidden mb-12 border border-white/10">
            <img 
              src={post.thumbnail} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-muted-foreground">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <Calendar className="w-3 h-3 text-primary" />
                {post.createdAt ? format(new Date(post.createdAt), 'MMM dd, yyyy') : 'Recently'}
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <Clock className="w-3 h-3 text-accent" />
                5 min read
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-display font-black tracking-tighter uppercase leading-tight">
              {post.title}
            </h1>

            <p className="text-xl text-muted-foreground font-light leading-relaxed italic border-l-4 border-primary pl-6 py-2">
              {post.description}
            </p>

            <div 
              className="prose prose-invert prose-primary max-w-none pt-8 border-t border-white/5 
                prose-headings:font-display prose-headings:uppercase prose-headings:tracking-tighter
                prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-lg
                prose-img:rounded-xl prose-img:border prose-img:border-white/10"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-white/10 bg-black/50 py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm font-mono">
          &copy; {new Date().getFullYear()} System All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
