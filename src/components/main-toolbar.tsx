// src/components/main-toolbar.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MainToolbarProps {
  onAddNode: () => void;
  isLoading?: boolean;
}

export function MainToolbar({ onAddNode, isLoading }: MainToolbarProps) {
  return (
    <div className="p-2 border-b border-border bg-card flex items-center space-x-2">
      <Button onClick={onAddNode} disabled={isLoading} size="sm">
        <Plus className="mr-1 h-4 w-4" /> Add Step
      </Button>
      {/* Future global tools can be added here */}
    </div>
  );
}
