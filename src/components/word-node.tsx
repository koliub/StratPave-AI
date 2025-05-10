"use client";

import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type WordNodeData = {
  label: string;
  isLoading?: boolean;
};

export function WordNode({ data, selected }: NodeProps<WordNodeData>) {
  return (
    <Card
      className={cn(
        "w-48 shadow-xl", // Increased shadow for more pop
        data.isLoading ? 'animate-pulse' : '',
        'bg-accent text-accent-foreground border-accent-foreground/20', // Apply accent colors
        selected && 'ring-2 ring-ring ring-offset-2 ring-offset-background' // Add selection ring
      )}
      aria-label={`Node displaying word: ${data.label}`}
    >
      <CardContent className="p-4 text-center">
        <div className="text-lg font-semibold break-all">
          {data.isLoading ? 'Processing...' : data.label || 'Enter prompt'}
        </div>
      </CardContent>
      {/* Handles are present for React Flow internals but visually hidden as they are not used for connections */}
      <Handle type="target" position={Position.Top} className="!w-1 !h-1 !bg-transparent !border-none" />
      <Handle type="source" position={Position.Bottom} className="!w-1 !h-1 !bg-transparent !border-none" />
    </Card>
  );
}
