
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
import { Loader2, ChevronDown, ChevronUp, Circle, CheckCircle2, Save, XSquare, PlusSquare } from 'lucide-react';

export type WordNodeData = {
  title: string;
  description?: string;
  isLoading?: boolean;
  isDone?: boolean;
  onToggleDone?: (id: string) => void;
  onUpdateNodeData?: (id: string, updatedData: { title: string; description?: string }) => void;
  onDeleteNode?: (id: string) => void;
  onAddNodeAfter?: (id: string) => void;
  _isExpandedOverride?: boolean; // Controlled from parent for global actions
  onManualToggleExpansion?: (id: string) => void; // Callback for manual toggle by user
};

export function WordNode({ data, selected, id }: NodeProps<WordNodeData>) {
  const [isInternallyExpanded, setIsInternallyExpanded] = useState(true); // Node's own preference

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(data.title);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(data.description || '');

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const hasDescription = !!data.description && !data.isLoading;

  // Effective expansion state: global override takes precedence, then internal state.
  const isEffectivelyExpanded = data._isExpandedOverride !== undefined 
    ? data._isExpandedOverride 
    : isInternallyExpanded;

  const toggleExpansion = () => {
    // Signal parent that a manual toggle occurred for this node.
    // Parent might then clear global overrides and allow this node's internal state to take effect.
    if (data.onManualToggleExpansion) {
      data.onManualToggleExpansion(id);
    }
    // Always toggle the internal preference. It will be used if _isExpandedOverride becomes undefined.
    setIsInternallyExpanded(prevExpanded => !prevExpanded);
  };


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
      data.onUpdateNodeData(id, { title: editedTitle, description: editedDescription });
    } else {
      setEditedTitle(data.title);
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    if (data.onUpdateNodeData) {
      data.onUpdateNodeData(id, { title: editedTitle, description: editedDescription });
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

  const handleDelete = () => {
    if (data.onDeleteNode && !data.isLoading) {
      data.onDeleteNode(id);
    }
  };

  const handleAddNode = () => {
    if (data.onAddNodeAfter && !data.isLoading) {
      data.onAddNodeAfter(id);
    }
  };

  return (
    <Card
      className={cn(
        "w-64 shadow-xl transition-all duration-300 group relative",
        'bg-card text-card-foreground', 
        data.isLoading && 'opacity-70', 
        data.isDone && !data.isLoading && 'opacity-70 border-2 border-[hsl(var(--success))]', 
        !data.isDone && !data.isLoading && 'border-border', 
        selected && !data.isLoading && !data.isDone && 'ring-2 ring-ring ring-offset-background',
        selected && !data.isLoading && data.isDone && 'ring-2 ring-[hsl(var(--success))] ring-offset-background',
      )}
      aria-label={`Roadmap step: ${data.title}`}
      aria-checked={data.isDone}
      aria-expanded={hasDescription ? isEffectivelyExpanded : undefined}
    >
      {selected && !data.isLoading && (data.onDeleteNode || data.onAddNodeAfter) && (
        <div className="absolute -top-2 -right-10 z-10 flex flex-col space-y-1">
          {data.onDeleteNode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-7 w-7 p-1 bg-card hover:bg-destructive hover:text-destructive-foreground rounded-full shadow-md border border-border"
              aria-label="Delete step"
              title="Delete step (Del / Ctrl+X)"
            >
              <XSquare className="h-5 w-5" />
            </Button>
          )}
          {data.onAddNodeAfter && (
             <Button
              variant="ghost"
              size="icon"
              onClick={handleAddNode}
              className="h-7 w-7 p-1 bg-card hover:bg-accent hover:text-accent-foreground rounded-full shadow-md border border-border"
              aria-label="Add step after"
              title="Add step after"
            >
              <PlusSquare className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}
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
                  <CheckCircle2 className="h-5 w-5 text-success" />
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
                onClick={toggleExpansion}
                className="h-6 w-6"
                aria-label={isEffectivelyExpanded ? 'Collapse description' : 'Expand description'}
                title={isEffectivelyExpanded ? 'Collapse description' : 'Expand description'}
              >
                {isEffectivelyExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
      {hasDescription && isEffectivelyExpanded && (
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
              {editedDescription || (data.isDone && !data.description ? "" : "Double-click to add description")}
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

