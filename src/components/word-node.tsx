"use client";

import { useState } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export type WordNodeData = {
  title: string;
  description?: string;
  isLoading?: boolean;
};

export function WordNode({ data, selected, id }: NodeProps<WordNodeData>) {
  const [isExpanded, setIsExpanded] = useState(true);

  const hasDescription = !!data.description && !data.isLoading;

  return (
    <Card
      className={cn(
        "w-64 shadow-xl",
        data.isLoading ? 'opacity-70' : '',
        'bg-card text-card-foreground border-border', 
        selected && 'ring-2 ring-ring ring-offset-2 ring-offset-background'
      )}
      aria-label={`Roadmap step: ${data.title}`}
      aria-expanded={hasDescription ? isExpanded : undefined}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold break-words flex-grow">
            {data.isLoading ? 'Generating...' : data.title || 'Untitled Step'}
          </CardTitle>
          {data.isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2 shrink-0" />}
          {hasDescription && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 ml-2 shrink-0"
              aria-label={isExpanded ? 'Collapse description' : 'Expand description'}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </CardHeader>
      {hasDescription && isExpanded && (
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
