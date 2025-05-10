// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Loader2, ChevronDown, ChevronUp, Circle, CheckCircle2, Save } from 'lucide-react';

export type WordNodeData = {
  title: string;
  description?: string;
  isLoading?: boolean;
  isDone?: boolean;
  onToggleDone?: (id: string) => void;
  onUpdateNodeData?: (id: string, updatedData: { title: string; description?: string }) => void;
};

export function WordNode({ data, selected, id }: NodeProps<WordNodeData>) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(data.title);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(data.description || '');

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const hasDescription = !!data.description && !data.isLoading;

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDescription && descriptionTextareaRef.current) {
      descriptionTextareaRef.current.focus();
      descriptionTextareaRef.current.select();
    }
  }, [isEditingDescription]);
  
  useEffect(() => {
    if (!isEditingTitle) {
      setEditedTitle(data.title);
    }
  }, [data.title, isEditingTitle]);

  useEffect(() => {
    if (!isEditingDescription) {
      setEditedDescription(data.description || '');
    }
  }, [data.description, isEditingDescription]);


  const handleTitleSave = () => {
    if (data.onUpdateNodeData && editedTitle.trim() !== '') {
      data.onUpdateNodeData(id, { title: editedTitle, description: editedDescription }); // Use editedDescription here
    } else {
      setEditedTitle(data.title);
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    if (data.onUpdateNodeData) {
      data.onUpdateNodeData(id, { title: editedTitle, description: editedDescription }); // Use editedTitle here
    }
    setIsEditingDescription(false);
  };

  const handleTitleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleTitleSave();
    } else if (event.key === 'Escape') {
      setEditedTitle(data.title);
      setIsEditingTitle(false);
    }
  };

  const handleDescriptionKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      handleDescriptionSave();
    } else if (event.key === 'Escape') {
      setEditedDescription(data.description || '');
      setIsEditingDescription(false);
    }
  };


  return (
    <Card
      className={cn(
        "w-64 shadow-xl transition-all duration-300 group",
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
        <div className="flex items-start justify-between">
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
            <div className="flex-grow min-w-0" onDoubleClick={() => !data.isLoading && !data.isDone && setIsEditingTitle(true)}>
              {isEditingTitle && !data.isLoading ? (
                <Input
                  ref={titleInputRef}
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="text-base font-semibold h-auto p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0 m-0 bg-transparent"
                  aria-label="Edit title input"
                />
              ) : (
                <CardTitle className={cn(
                  "text-base font-semibold break-words cursor-pointer relative",
                   data.isDone && "line-through text-muted-foreground"
                )}>
                  {data.isLoading ? 'Generating...' : data.title || 'Untitled Step'}
                </CardTitle>
              )}
            </div>
          </div>
          <div className="flex items-center shrink-0 pl-1">
            {data.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {!isEditingTitle && hasDescription && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6"
                aria-label={isExpanded ? 'Collapse description' : 'Expand description'}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
             {isEditingTitle && (
              <Button variant="ghost" size="icon" onClick={handleTitleSave} className="h-6 w-6 text-accent">
                <Save className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {hasDescription && isExpanded && (
        <CardContent className="p-3 pt-0" onDoubleClick={() => !data.isLoading && !data.isDone && setIsEditingDescription(true)}>
          {isEditingDescription && !data.isLoading ? (
            <div className="relative">
              <Textarea
                ref={descriptionTextareaRef}
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                onBlur={handleDescriptionSave}
                onKeyDown={handleDescriptionKeyDown}
                className="text-xs min-h-[60px] focus-visible:ring-1 bg-transparent"
                rows={3}
                aria-label="Edit description textarea"
              />
              <Button variant="ghost" size="icon" onClick={handleDescriptionSave} className="h-6 w-6 text-accent absolute bottom-1 right-1">
                <Save className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <CardDescription className={cn(
              "text-xs break-words cursor-pointer relative min-h-[2em]", 
              data.isDone && "text-muted-foreground opacity-80"
            )}>
              {editedDescription || (data.isDone ? "" : "Double-click to add description")}
            </CardDescription>
          )}
        </CardContent>
      )}
      <Handle type="target" position={Position.Top} id={`${id}-target`} className="!w-px !h-px !bg-transparent !border-none" />
      <Handle type="source" position={Position.Bottom} id={`${id}-source`} className="!w-px !h-px !bg-transparent !border-none" />
      <Handle type="source" position={Position.Left} id={`${id}-left`} className="!w-px !h-px !bg-transparent !border-none" />
      <Handle type="source" position={Position.Right} id={`${id}-right`} className="!w-px !h-px !bg-transparent !border-none" />
    </Card>
  );
}
