import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl,FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPostSchema, type Post } from "../../../shared/schema.js";
import { Loader2, Plus, Pencil, Trash2, Key } from "lucide-react";

export default function AdminPanel() {
  const { toast } = useToast();
  const [authKey, setAuthKey] = useState<string>(localStorage.getItem("admin_key") || "");
  const [isEditing, setIsEditing] = useState<Post | null>(null);

  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  const form = useForm({
    resolver: zodResolver(insertPostSchema),
    defaultValues: {
      title: "",
      description: "",
      thumbnail: "",
      content: "",
      authKey: authKey
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/posts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Post created successfully" });
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Failed to create post", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/posts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Post updated successfully" });
      setIsEditing(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to update post", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/posts/${id}`, { authKey });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Post deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete post", description: error.message, variant: "destructive" });
    }
  });

  const handleAuthSave = (key: string) => {
    setAuthKey(key);
    localStorage.setItem("admin_key", key);
    form.setValue("authKey", key);
    toast({ title: "Auth key saved" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <header className="flex justify-between items-center mb-8 gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">Content Panel</h1>
        <div className="flex items-center gap-2">
          <Input 
            type="password" 
            placeholder="Enter Admin Key" 
            value={authKey} 
            onChange={(e) => handleAuthSave(e.target.value)}
            className="w-48"
          />
          <Dialog>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New Post</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
              </DialogHeader>
              <PostForm 
                onSubmit={(data) => createMutation.mutate(data)} 
                isPending={createMutation.isPending}
                authKey={authKey}
              />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts?.map((post) => (
          <Card key={post.id.toString()} className="hover-elevate">
            <img 
              src={post.thumbnail} 
              alt={post.title} 
              className="w-full h-48 object-cover rounded-t-md"
            />
            <CardHeader>
              <CardTitle className="text-xl line-clamp-1">{post.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground line-clamp-2 mb-4">{post.description}</p>
              <div className="flex justify-end gap-2">
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={() => setIsEditing(post)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(post.id.toString())}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isEditing && (
        <Dialog open={!!isEditing} onOpenChange={() => setIsEditing(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
            </DialogHeader>
            <PostForm 
              initialData={isEditing}
              onSubmit={(data) => updateMutation.mutate({ id: isEditing.id.toString(), data })}
              isPending={updateMutation.isPending}
              authKey={authKey}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function PostForm({ onSubmit, isPending, initialData, authKey }: any) {
  const form = useForm({
    resolver: zodResolver(insertPostSchema),
    defaultValues: initialData ? { ...initialData, authKey } : {
      title: "",
      description: "",
      thumbnail: "",
      content: "",
      authKey
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl><Input {...field} /></FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea {...field} /></FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="thumbnail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thumbnail URL</FormLabel>
              <FormControl><Input {...field} /></FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content (HTML supported)</FormLabel>
              <FormControl>
                <Textarea 
                  className="min-h-[200px] font-mono" 
                  placeholder="<p>Rich content here...</p><img src='...' />"
                  {...field} 
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update Post" : "Create Post"}
        </Button>
      </form>
    </Form>
  );
}
