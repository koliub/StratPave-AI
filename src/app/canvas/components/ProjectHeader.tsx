// Suggested code may be subject to a license. Learn more: ~LicenseLog:4205608593.
// Suggested code may be subject to a license. Learn more: ~LicenseLog:3832730345.

"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"; // Adjust import path if necessary

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { UserAuthSection } from '@/components/auth/UserAuthSection';
import { type Node } from 'reactflow';
import { Loader2, Maximize, Minimize, MapIcon, HomeIcon, SaveIcon, HelpCircle } from 'lucide-react'; // Import the HelpCircle icon
import { type WordNodeData } from '@/app/canvas/components/word-node';
import { useAuthModal } from '@/stores/useAuthModal';
import { HelpModal } from "@/app/canvas/components/HelpModal"; // Make sure path is correct


interface ProjectHeaderProps {
  projectTitle: string;
  onProjectTitleChange: (value: string) => void;
  onSaveRoadmap: () => Promise<string | null>;
  isLoading: boolean;
  nodes: Node<WordNodeData>[];
  projectId?: string | null;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  isMiniMapVisible: boolean;
  onToggleMiniMap: () => void;
  isUserLoggedIn: boolean;
}

export function ProjectHeader({
  projectTitle,
  onProjectTitleChange,
  onSaveRoadmap,
  isLoading,
  nodes,
  projectId,
  onExpandAll,
  onCollapseAll,
  isMiniMapVisible,
  onToggleMiniMap,
  isUserLoggedIn,
}: ProjectHeaderProps) {
  const isNewProject = projectId === 'new' || !projectId;
  const hasContent = nodes.length > 0;
  const [isHelpOpen, setHelpOpen] = useState(false);
  const [helpView, setHelpView] = useState<'tutorial' | 'faq' | 'feedback'>('tutorial');

  const { openModal } = useAuthModal(); 
  const [saveAttemptedWhileLoggedOut, setSaveAttemptedWhileLoggedOut] = useState(false);
  useEffect(() => {
    if (isUserLoggedIn && saveAttemptedWhileLoggedOut) {
      // User is logged in and a save was pending
      onSaveRoadmap(); // Call save using the current state/props
      setSaveAttemptedWhileLoggedOut(false); // Reset the flag
    }
  }, [isUserLoggedIn, saveAttemptedWhileLoggedOut, onSaveRoadmap]); // Add dependencies

  return (
    <header className="p-4 border-b border-border shadow-sm bg-card sticky top-0 z-50">
      <div className="container mx-auto flex flex-wrap items-center gap-2 sm:gap-4">
        <Link href="/dashboard" passHref>
          <Button variant="outline" size="icon" title="Back to Dashboard" className="shrink-0 p-2 h-10 w-10">
            <HomeIcon className="h-5 w-5" />
          </Button>
        </Link>
        
        <Input
          type="text"
          placeholder="Project Title (optional)"
          value={projectTitle}
          onChange={(e) => onProjectTitleChange(e.target.value)}
          className="h-10 sm:max-w-xs w-48"
          disabled={isLoading}
          aria-label="Project title input field"
        />

        <Button
          onClick={() => {
            if (isUserLoggedIn) {
              onSaveRoadmap();
            } else {
              setSaveAttemptedWhileLoggedOut(true); // Set the flag
              openModal("login");
            }
          }}
          disabled={isLoading}
          variant="outline"
          className="w-full sm:w-auto shrink-0 px-4 h-10"
          title="Save current roadmap"
        >
          {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <SaveIcon className="mr-2 h-4 w-4" />}
          Save Project
        </Button>
       

       
              {/* Help Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" title="Help and Feedback" className="shrink-0 p-2 h-10 w-10">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setHelpView("tutorial");
                setHelpOpen(true);
              }}
            >
              📘 Tutorial
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setHelpView("faq");
                setHelpOpen(true);
              }}
            >
              ❓ FAQ
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setHelpView("feedback");
                setHelpOpen(true);
              }}
            >
              📝 Feedback
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1 mt-2 sm:mt-0 sm:ml-auto w-full sm:w-auto justify-end">
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
          <UserAuthSection />
        </div>
      </div>
      <HelpModal open={isHelpOpen} onOpenChange={setHelpOpen} view={helpView} />
    </header>
    
  );
}
