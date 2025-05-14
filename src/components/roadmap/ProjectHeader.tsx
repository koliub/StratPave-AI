"use client";

import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Loader2, Maximize, Minimize, MapIcon, HomeIcon } from 'lucide-react';
import { type Node } from 'reactflow';
import { type WordNodeData } from '@/components/word-node';

interface ProjectHeaderProps {
  promptText: string;
  onPromptTextChange: (value: string) => void;
  onGenerateRoadmap: () => void;
  isLoading: boolean;
  nodes: Node<WordNodeData>[];
  projectId?: string;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  isMiniMapVisible: boolean;
  onToggleMiniMap: () => void;
}

export function ProjectHeader({
  promptText,
  onPromptTextChange,
  onGenerateRoadmap,
  isLoading,
  nodes,
  projectId,
  onExpandAll,
  onCollapseAll,
  isMiniMapVisible,
  onToggleMiniMap,
}: ProjectHeaderProps) {
  return (
    <header className="p-4 border-b border-border shadow-sm bg-card sticky top-0 z-50">
      <div className="container mx-auto flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
        <Link href="/dashboard" passHref>
          <Button variant="outline" size="icon" title="Back to Home" className="shrink-0 p-2 h-10 w-10">
            <HomeIcon className="h-5 w-5" />
          </Button>
        </Link>
        <Input
          type="text"
          placeholder="Your project idea..."
          value={promptText}
          onChange={(e) => onPromptTextChange(e.target.value)}
          className="flex-grow min-w-0 h-10"
          disabled={isLoading}
          onKeyDown={(e) => { if (e.key === 'Enter' && !isLoading) onGenerateRoadmap(); }}
          aria-label="Project idea input field"
        />
        <Button onClick={onGenerateRoadmap} disabled={isLoading} className="w-full sm:w-auto shrink-0 px-4 h-10">
          {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
          {isLoading ? 'Generating...' : (nodes.length > 0 && projectId === 'new' ? 'Regenerate' : 'Generate Roadmap')}
        </Button>
        <div className="sm:ml-auto flex items-center gap-1 self-center sm:self-auto mt-2 sm:mt-0">
          <Button
            variant="outline"
            size="icon"
            onClick={onExpandAll}
            disabled={isLoading || nodes.length === 0 || nodes.every(n => n.data.isLoading || !n.data.description)}
            title="Expand All Descriptions"
            aria-label="Expand all node descriptions"
            className="h-10 w-10"
          >
            <Maximize className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onCollapseAll}
            disabled={isLoading || nodes.length === 0 || nodes.every(n => n.data.isLoading || !n.data.description)}
            title="Collapse All Descriptions"
            aria-label="Collapse all node descriptions"
            className="h-10 w-10"
          >
            <Minimize className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleMiniMap}
            title={isMiniMapVisible ? "Hide Minimap" : "Show Minimap"}
            aria-label={isMiniMapVisible ? "Hide Minimap" : "Show Minimap"}
            className="h-10 w-10"
          >
            <MapIcon className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
