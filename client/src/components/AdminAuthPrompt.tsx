import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Lock } from "lucide-react";

interface AdminAuthPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (authKey: string) => void;
  title?: string;
}

export function AdminAuthPrompt({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Admin Authentication Required" 
}: AdminAuthPromptProps) {
  const [authKey, setAuthKey] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authKey.trim()) {
      onConfirm(authKey);
      setAuthKey("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Please enter the Admin Auth Key to proceed with this action.
            </p>
            <Input
              type="password"
              placeholder="Enter Admin Key"
              value={authKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuthKey(e.target.value)}
              className="bg-secondary/20"
              autoFocus
            />
          </div>
          <DialogFooter className="flex sm:justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="default">
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
