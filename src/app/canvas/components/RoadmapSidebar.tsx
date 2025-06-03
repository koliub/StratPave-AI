"use client";

import Image from 'next/image';
import Link from 'next/link';

import React from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger, // Import SidebarTrigger
} from '@/components/ui/sidebar'; // Adjust if path is different
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ListTree } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Node } from 'reactflow';
import type { WordNodeData } from '@/app/canvas/components/word-node'; // Assuming WordNodeData is exported

interface RoadmapSidebarProps {
  nodes: Node<WordNodeData>[];
  isLoading: boolean;
  selectedNodeIdFromSidebar: string | null;
  onNodeSelect: (nodeId: string) => void;
}

export function RoadmapSidebar({
  nodes,
  isLoading,
  selectedNodeIdFromSidebar,
  onNodeSelect,
}: RoadmapSidebarProps) {
  return (
    <Sidebar collapsible="icon" side="left">
      {/* Add SidebarTrigger as a pull tab */}
      <SidebarTrigger className="absolute top-1/2 -translate-y-1/2 right-0 z-20 p-1 h-8 w-8 rounded-l-full rounded-r-none data-[state=collapsed]:rotate-180 data-[state=collapsed]:right-0" />
      <SidebarHeader className="p-2 space-y-4 group-data-[collapsible=icon]:py-2"> {/* Added space-y-4 for spacing */}
        {/* Stratapve Logo - Full logo when expanded, symbol only when collapsed */}
        <div className="flex items-center"> {/* Added padding and centering */}
          <Link href="/">
            {/* Full logo for expanded state */}
            <Image
              src="/logos/SymbolAndText_Logo_TransparentBG.png"
              alt="Stratapve Logo"
              width={120}
              height={30}
              className="dark:hidden group-data-[collapsible=icon]:hidden"
            />
            <Image
              src="/logos/WhiteSymbolAndText_Logo_TransparentBG.png"
              alt="Stratapve Logo"
              width={120}
              height={30}
              className="hidden dark:block group-data-[collapsible=icon]:hidden"
            />
            {/* Symbol only for collapsed state */}
            <Image
              src="/logos/Symbol_Logo_TransparentBG.png"
              alt="Stratapve Logo"
              width={50}
              height={50}
              className="dark:hidden hidden group-data-[collapsible=icon]:block"
            />
            <Image
            src="/logos/WhiteSymbol_Logo_TransparentBG.png"
            alt="Stratapve Logo"
            width={50}
            height={50}
            className="hidden dark:block group-data-[collapsible=icon]:block"
          />
        </Link>

        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold pl-2 group-data-[collapsible=icon]:hidden">Roadmap Steps</h2>
          <ListTree className="h-5 w-5 group-data-[collapsible=icon]:mx-auto" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {nodes.length === 0 && !isLoading && (
          <p className="p-4 text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
            Generate a roadmap to see steps here.
          </p>
        )}
        {isLoading && nodes.some(n => n.data.isLoading) && (
          <p className="p-4 text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
            Generating...
          </p>
        )}
        <ScrollArea className="h-full">
          <ul className="p-2 space-y-1 group-data-[collapsible=icon]:space-y-2">
            {nodes.filter(n => !n.data.isLoading).map((node, index) => (
              <li key={node.id}>
                <Button
                  variant={selectedNodeIdFromSidebar === node.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-left h-auto py-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8",
                    node.data.isDone && "line-through opacity-70"
                  )}
                  onClick={() => onNodeSelect(node.id)}
                  title={node.data.title}
                >
                  <span className="group-data-[collapsible=icon]:hidden truncate">
                    {`${index + 1}. ${node.data.title}`}
                  </span>
                  <span className="hidden group-data-[collapsible=icon]:inline">
                    {`${index + 1}`}
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
