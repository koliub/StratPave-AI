
"use client";

import React from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeTypes,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { WordNodeData } from '@/components/word-node'; 

interface RoadmapCanvasProps {
  nodes: Node<WordNodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  nodeTypes: NodeTypes;
  isMiniMapVisible: boolean; 
}

export function RoadmapCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  nodeTypes,
  isMiniMapVisible, 
}: RoadmapCanvasProps) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitViewOptions={{ padding: 0.2, duration: 300 }}
      className="bg-background"
      proOptions={{ hideAttribution: true }}
      deleteKeyCode={null} 
    >
      <Controls 
        className="[&_button]:bg-card [&_button]:border-border [&_button:hover]:bg-muted [&_button_svg]:fill-foreground" 
        position="bottom-right"
      />
      {isMiniMapVisible && (
         <MiniMap 
          nodeStrokeWidth={3} 
          nodeColor={(node) => {
            if (node.type === 'wordNode' && node.data.isLoading) return 'hsl(var(--muted-foreground))';
            if (node.type === 'wordNode' && node.data.isDone) return 'hsl(var(--success))';
            // Use node's specific color if available, otherwise accent or default
            if (node.type === 'wordNode' && node.data.color) return node.data.color; 
            if (node.type === 'wordNode') return 'hsl(var(--accent))'; 
            return 'hsl(var(--muted-foreground))'; 
          }} 
          pannable 
          zoomable 
          className="!bg-card border border-border rounded-md shadow-lg"
          ariaLabel="Minimap for canvas navigation"
        />
      )}
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="hsl(var(--border))" />
    </ReactFlow>
  );
}
