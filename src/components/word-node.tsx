"use client";

import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export type WordNodeData = {
  title: string;
  description?: string;
  isLoading?: boolean;
};

export function WordNode({ data, selected, id }: NodeProps<WordNodeData>) {
  return (
    <Card
      className={cn(
        "w-64 shadow-xl", // Increased width and shadow for more pop
        data.isLoading ? 'opacity-70' : '', // Use opacity for loading instead of pulse for better text readability
        'bg-card text-card-foreground border-border', 
        selected && 'ring-2 ring-ring ring-offset-2 ring-offset-background'
      )}
      aria-label={`Roadmap step: ${data.title}`}
    >
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-base font-semibold break-words flex items-center justify-between">
          {data.isLoading ? 'Generating...' : data.title || 'Untitled Step'}
          {data.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      {data.description && !data.isLoading && (
        <CardContent className="p-3 pt-0">
          <CardDescription className="text-xs break-words">
            {data.description}
          </CardDescription>
        </CardContent>
      )}
       {/* Handles are present for React Flow internals but visually hidden as they are not used for connections */}
      <Handle type="target" position={Position.Top} id={`${id}-target`} className="!w-px !h-px !bg-transparent !border-none" />
      <Handle type="source" position={Position.Bottom} id={`${id}-source`} className="!w-px !h-px !bg-transparent !border-none" />
      <Handle type="source" position={Position.Left} id={`${id}-left`} className="!w-px !h-px !bg-transparent !border-none" />
      <Handle type="source" position={Position.Right} id={`${id}-right`} className="!w-px !h-px !bg-transparent !border-none" />
    </Card>
  );
}
