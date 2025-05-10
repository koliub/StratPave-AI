"use client";

import { useState } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, ChevronDown, ChevronUp, Circle, CheckCircle2 } from 'lucide-react';

export type WordNodeData = {
  title: string;
  description?: string;
  isLoading?: boolean;
  isDone?: boolean;
  onToggleDone?: (id: string) => void;
};

export function WordNode({ data, selected, id }: NodeProps<WordNodeData>) {
  const [isExpanded, setIsExpanded] = useState(true);

  const hasDescription = !!data.description && !data.isLoading;

  return (
    <Card
      className={cn(
        "w-64 shadow-xl transition-all duration-300",
        data.isLoading ? 'opacity-70' : '',
        data.isDone ? 'opacity-60' : 'opacity-100',
        'bg-card text-card-foreground border-border', 
        selected && !data.isDone && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
        selected && data.isDone && 'ring-2 ring-[hsl(var(--success))] ring-offset-2 ring-offset-background'
      )}
      aria-label={`Roadmap step: ${data.title}`}
      aria-checked={data.isDone}
      aria-expanded={hasDescription ? isExpanded : undefined}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-grow min-w-0">
            {!data.isLoading && data.onToggleDone && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => data.onToggleDone!(id)}
                className="h-7 w-7 shrink-0 mr-2 p-1"
                aria-label={data.isDone ? 'Mark as not done' : 'Mark as done'}
                title={data.isDone ? 'Mark as not done' : 'Mark as done'}
              >
                {data.isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))]" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
            )}
            <CardTitle className={cn(
              "text-base font-semibold break-words",
              data.isDone && "line-through text-muted-foreground"
            )}>
              {data.isLoading ? 'Generating...' : data.title || 'Untitled Step'}
            </CardTitle>
          </div>
          <div className="flex items-center shrink-0">
            {data.isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            {hasDescription && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 ml-2"
                aria-label={isExpanded ? 'Collapse description' : 'Expand description'}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {hasDescription && isExpanded && (
        <CardContent className="p-3 pt-0">
          <CardDescription className={cn(
            "text-xs break-words",
            data.isDone && "text-muted-foreground opacity-80"
            )}>
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
