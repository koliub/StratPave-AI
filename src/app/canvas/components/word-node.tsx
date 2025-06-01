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
import { Loader2, ChevronDown, ChevronUp, Circle, CheckCircle2, Save, XSquare, PlusSquare, GitBranch } from 'lucide-react';

export type WordNodeData = {
  title: string;
  description?: string;
  isLoading?: boolean; // For main roadmap loading or this node's own loading state
  isLoadingSubRoadmap?: boolean; // Specifically for when this node is generating a sub-roadmap
  isDone?: boolean;
  onToggleDone?: (id: string) => void;
  onUpdateNodeData?: (id: string, updatedData: { title: string; description?: string }) => void;
  onDeleteNode?: (id: string) => void;
  onAddNodeAfter?: (id: string) => void;
  onGenerateSubRoadmap?: (id: string) => void;
  _isExpandedOverride?: boolean;
  onManualToggleExpansion?: (id: string, explicitlyExpanded?: boolean) => void; 
  color?: string;
  onUpdateNodeColor?: (id: string, color: string) => void;
 isSubStep?: boolean; // To identify if this node is a sub-step
  isSubroadmapParent?: boolean; // Added to indicate if this node has a sub-roadmap
  onToggleSubRoadmap?: (id: string) => void; // Added to toggle sub-roadmap visibility
  isExpandedSubroadmap?: boolean; // Added to track sub-roadmap expansion state
  depth?: number; // Added for hierarchical structure
  parentId?: string; // Added for hierarchical structure
};

export function WordNode({ data, selected, id }: NodeProps<WordNodeData>) {
  const [isInternallyExpanded, setIsInternallyExpanded] = useState(() => {
    if (data._isExpandedOverride !== undefined) {
      return data._isExpandedOverride;
    }
    return !!data.description; 
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(data.title);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(data.description || '');

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const hasDescription = !!data.description && !data.isLoading;

  useEffect(() => {
    if (data._isExpandedOverride !== undefined) {
      setIsInternallyExpanded(data._isExpandedOverride);
    }
  }, [data._isExpandedOverride]);
  
  const isEffectivelyExpanded = hasDescription ? isInternallyExpanded : false;


  const toggleExpansion = () => {
    if (data.onManualToggleExpansion) {
      data.onManualToggleExpansion(id, !isInternallyExpanded);
    }
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
      data.onUpdateNodeData(id, { title: editedTitle, description: data.description });
    } else {
      setEditedTitle(data.title); 
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    if (data.onUpdateNodeData) {
      data.onUpdateNodeData(id, { title: data.title, description: editedDescription });
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
    if (data.onDeleteNode && !data.isLoading && !data.isLoadingSubRoadmap) {
      data.onDeleteNode(id);
    }
  };

  const handleAddNode = () => {
    if (data.onAddNodeAfter && !data.isLoading && !data.isLoadingSubRoadmap) {
      data.onAddNodeAfter(id);
    }
  };

  const handleGenerateSubRoadmap = () => {
    if (data.onGenerateSubRoadmap && !data.isLoading && !data.isLoadingSubRoadmap) {
      data.onGenerateSubRoadmap(id);
    }
  };

  const handleToggleSubRoadmap = () => {
    if (data.onToggleSubRoadmap && !data.isLoading && !data.isLoadingSubRoadmap) {
      data.onToggleSubRoadmap(id);
    }
  };

  const cardStyle = data.color && !data.isDone ? { borderColor: data.color, borderWidth: '1px' } : {};
  const doneStyle = data.isDone && !data.isLoading ? { borderColor: 'hsl(var(--success))', borderWidth: '2px'} : {};
  const selectedStyle = selected && !data.isLoading ?
    (data.isDone ? { ring: '2px', ringColor: 'hsl(var(--success))', outline: '2px solid hsl(var(--success))', outlineOffset: '2px'}
                  : { ring: '2px', ringColor: 'hsl(var(--primary))', outline: '2px solid hsl(var(--primary))', outlineOffset: '2px' })
    : {};


  return (
    <Card
      className={cn(
        "w-64 shadow-md transition-all duration-300 group relative",
        data.isSubnode ? 'border-l-4 border-blue-300 bg-blue-50' : 'bg-white',
        'bg-card text-card-foreground',
        (data.isLoading || data.isLoadingSubRoadmap) && 'opacity-70',
        data.isDone && !data.isLoading && !data.isLoadingSubRoadmap && 'opacity-70 border-2 border-success',
        selected && !data.isLoading && !data.isLoadingSubRoadmap && !data.isDone && 'ring-2 ring-primary ring-offset-0', 
        selected && !data.isLoading && !data.isLoadingSubRoadmap && data.isDone && 'ring-2 ring-success ring-offset-0', 
      )}
      style={{...cardStyle, ...doneStyle, ...selectedStyle.ring && {outline: `${selectedStyle.ring} solid ${selectedStyle.ringColor}`, outlineOffset: '1px'}}}
      aria-label={`Roadmap step: ${data.title}`}
      aria-checked={data.isDone}
      aria-expanded={hasDescription ? isEffectivelyExpanded : undefined}
    >
      {selected && !data.isLoading && !data.isLoadingSubRoadmap && (data.onDeleteNode || data.onAddNodeAfter || data.onGenerateSubRoadmap) && (
        <div className="absolute -top-3 right-2 z-10 flex flex-col space-y-1">
           {data.onDeleteNode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-7 w-7 p-1 bg-card hover:bg-destructive hover:text-destructive-foreground rounded-full shadow-md border border-border"
              aria-label="Delete step"
              title="Delete step (Del / Ctrl+X)"
              disabled={data.isLoadingSubRoadmap}
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
              disabled={data.isLoadingSubRoadmap}
            >
              <PlusSquare className="h-5 w-5" />
            </Button>
          )}
          {data.onGenerateSubRoadmap && !data.isSubnode && ( // Conditionally render if not a sub-step itself
             <Button
              variant="ghost"
              size="icon"
              onClick={handleGenerateSubRoadmap}
              className="h-7 w-7 p-1 bg-card hover:bg-accent hover:text-accent-foreground rounded-full shadow-md border border-border"
              aria-label="Generate sub-roadmap for this step"
              title="Generate sub-roadmap for this step"
              disabled={data.isLoadingSubRoadmap}
            >
              {data.isLoadingSubRoadmap ? <Loader2 className="h-5 w-5 animate-spin" /> : <GitBranch className="h-5 w-5" />}
            </Button>
          )}
        </div>
      )}
      <CardHeader 
        className="p-3 pb-2" 
      >
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
                disabled={data.isLoadingSubRoadmap}
              >
                {data.isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
            )}
            <div className="flex-grow min-w-0" onDoubleClick={() => !data.isLoading && !data.isDone && !data.isLoadingSubRoadmap && setIsEditingTitle(true)}>
              {isEditingTitle && !data.isLoading && !data.isLoadingSubRoadmap ? (
                <Input
                  ref={titleInputRef}
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="text-base font-semibold h-auto p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0 m-0 bg-transparent text-card-foreground"
                  aria-label="Edit title input"
                />
              ) : (
                <CardTitle className={cn(
                  "text-base font-semibold break-words cursor-pointer relative text-card-foreground",
                  data.isDone && "line-through text-muted-foreground"
                )}>
                  {data.isLoading ? 'Generating...' : data.isLoadingSubRoadmap ? 'Expanding...' : data.title || 'Untitled Step'}
                </CardTitle>
              )}
            </div>
          </div>
          <div className="flex items-center shrink-0 pl-1">
            {(data.isLoading || data.isLoadingSubRoadmap) && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/>}
            {!isEditingTitle && hasDescription && !data.isLoadingSubRoadmap && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleExpansion}
                className="h-6 w-6 text-muted-foreground"
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
      {hasDescription && isEffectivelyExpanded && !data.isLoadingSubRoadmap && (
        <CardContent className="p-3 pt-0 text-card-foreground" onDoubleClick={() => !data.isLoading && !data.isDone && !data.isLoadingSubRoadmap && setIsEditingDescription(true)}>
          {isEditingDescription && !data.isLoading && !data.isLoadingSubRoadmap ? (
            <div className="relative">
              <Textarea
                ref={descriptionTextareaRef}
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                onBlur={handleDescriptionSave}
                onKeyDown={handleDescriptionKeyDown}
                className="text-xs min-h-[60px] focus-visible:ring-1 bg-transparent text-card-foreground"
                rows={3}
                aria-label="Edit description textarea"
              />
              <Button variant="ghost" size="icon" onClick={handleDescriptionSave} className="h-6 w-6 text-accent absolute bottom-1 right-1">
                <Save className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <CardDescription className={cn(
              "text-xs break-words cursor-pointer relative min-h-[2em] text-muted-foreground",
              data.isDone && "opacity-80"
            )}>
              {editedDescription || (data.isDone && !data.description ? "" : "Double-click to add description")}
            </CardDescription>
          )}
        </CardContent>
      )}
      {/* Conditional container for the sub-roadmap */}
      {data.isSubroadmapParent && (
        <div className="subroadmap-container w-full border-t border-border p-2 text-center bg-accent/10">
          <button
            onClick={() => data.onToggleSubRoadmap?.(id)}
            className="text-xs text-blue-700 hover:underline font-medium"
          >
            {data.isExpandedSubroadmap ? 'Collapse Subroadmap' : 'Expand Subroadmap'}
          </button>
          {data.isExpandedSubroadmap && (
            <div className="mt-2 p-2 border border-dashed border-border rounded bg-background/50 min-h-[50px]">{/* Sub-roadmap nodes will be rendered here */}</div>)}
        </div>
      )}
      <Handle type="target" position={Position.Top} id={`${id}-target`} className="!w-px !h-px !bg-transparent !border-none" />
      <Handle type="source" position={Position.Bottom} id={`${id}-source`} className="!w-px !h-px !bg-transparent !border-none" />
      <Handle type="source" position={Position.Left} id={`${id}-left`} className="!w-px !h-px !bg-transparent !border-none" />
      <Handle type="source" position={Position.Right} id={`${id}-right`} className="!w-px !h-px !bg-transparent !border-none" />
    </Card>
  );
}
