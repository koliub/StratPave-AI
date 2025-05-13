
"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  type Node,
  type Edge,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
  type NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useSearchParams, useParams } from 'next/navigation';

import { WordNode, type WordNodeData } from '@/components/word-node';
import { generateRoadmap } from '@/ai/flows/generate-roadmap-flow';
import { useToast } from '@/hooks/use-toast';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';

import { RoadmapSidebar } from '@/components/roadmap/RoadmapSidebar';
import { RoadmapCanvas } from '@/components/roadmap/RoadmapCanvas';
import { ProjectHeader } from '@/components/roadmap/ProjectHeader';
import { useNodeManagement } from '@/hooks/useNodeManagement';

const nodeTypes: NodeTypes = {
  wordNode: WordNode,
};

const DEFAULT_NODE_COLOR = '#A0A0A0';

function FlowCanvas() {
  const [promptText, setPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(false); 
  const [selectedNodeIdFromSidebar, setSelectedNodeIdFromSidebar] = useState<string | null>(null);
  const [globalExpansionOverride, setGlobalExpansionOverride] = useState<boolean | null>(null);
  const [isMiniMapVisible, setIsMiniMapVisible] = useState(true);
  
  const generationAttempted = useRef(false);
  const { toast } = useToast();
  const reactFlowInstance = useReactFlow();
  const searchParams = useSearchParams(); 
  const params = useParams(); 
  const projectId = params.projectId as string;

  const {
    nodes,
    setNodes, 
    edges,
    setEdges,
    onNodesChange,
    onEdgesChange,
    nodeIdCounter, 
    setNodeIdCounter,
    handleUpdateNodeColor,
    handleDeleteNode,
    handleManualToggleExpansion,
    handleToggleNodeDone,
    handleUpdateNodeData,
    handleAddNodeAfter,
    handleGenerateSubRoadmapPrompt,
  } = useNodeManagement({
    isLoading: isLoading,
    reactFlowInstance: reactFlowInstance,
    globalExpansionOverride: globalExpansionOverride,
    projectPrompt: promptText, // Pass promptText here
  });

  useEffect(() => {
    if (reactFlowInstance && (nodes.length > 0 || edges.length > 0) && !selectedNodeIdFromSidebar) {
      const timer = setTimeout(() => {
        reactFlowInstance.fitView({ duration: 300, padding: 0.2 });
      }, 150); 
      return () => clearTimeout(timer);
    }
  }, [nodes, edges, reactFlowInstance, selectedNodeIdFromSidebar]);

  const doGenerateRoadmap = useCallback(async (currentPrompt?: string) => {
    const promptToUse = typeof currentPrompt === 'string' ? currentPrompt : promptText;
    if (!promptToUse.trim()) {
      toast({
        title: 'Prompt is empty',
        description: 'Please enter your project idea to generate a roadmap.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setSelectedNodeIdFromSidebar(null); 
    setGlobalExpansionOverride(null);
    
    let currentTempNodeIdCounter = nodeIdCounter;
    const tempLoadingNodeId = `loading_node_${currentTempNodeIdCounter}`;
    currentTempNodeIdCounter++;

    const tempLoadingNode: Node<WordNodeData> = {
      id: tempLoadingNodeId,
      type: 'wordNode',
      position: { x: 50, y: 50 }, 
      data: {
        title: 'Generating Roadmap...', 
        isLoading: true, 
        isDone: false,
        onToggleDone: handleToggleNodeDone,
        onUpdateNodeData: handleUpdateNodeData,
        onDeleteNode: handleDeleteNode,
        onAddNodeAfter: handleAddNodeAfter,
        onGenerateSubRoadmap: handleGenerateSubRoadmapPrompt,
        onManualToggleExpansion: handleManualToggleExpansion,
        onUpdateNodeColor: handleUpdateNodeColor,
      },
      draggable: true,
      selectable: true,
    };
    setNodes([tempLoadingNode]);
    setEdges([]); 
    setNodeIdCounter(currentTempNodeIdCounter);

    try {
      const result = await generateRoadmap({ prompt: promptToUse });
      
      if (!result.roadmap || result.roadmap.length === 0) {
        toast({
          title: 'No Roadmap Generated',
          description: 'The AI did not return any roadmap steps. Try a different prompt.',
          variant: 'default',
        });
        setNodes((nds) => nds.filter(node => node.id !== tempLoadingNodeId)); 
        setEdges([]);
        return;
      }
      
      let newNodesCounter = nodeIdCounter;
      const newNodesFromAI: Node<WordNodeData>[] = result.roadmap.map((step, index) => {
        const currentNodesCount = index; 
        const xPosition = (currentNodesCount % 3) * 280 + (Math.random() * 30 - 15) + 50; 
        const yPosition = Math.floor(currentNodesCount / 3) * 200 + (Math.random() * 30 - 15) + 50;
        const nodeId = `roadmapnode_${step.id.replace(/\s+/g, '_').toLowerCase()}_${newNodesCounter + index}`;
        return {
          id: nodeId,
          type: 'wordNode',
          position: { x: xPosition, y: yPosition },
          data: { 
            title: step.title, 
            description: step.description, 
            isLoading: false, 
            isDone: false, 
            onToggleDone: handleToggleNodeDone, 
            onUpdateNodeData: handleUpdateNodeData,
            onDeleteNode: handleDeleteNode, 
            onAddNodeAfter: handleAddNodeAfter,
            onGenerateSubRoadmap: handleGenerateSubRoadmapPrompt, 
            onManualToggleExpansion: handleManualToggleExpansion,
            onUpdateNodeColor: handleUpdateNodeColor, 
            color: DEFAULT_NODE_COLOR, 
            _isExpandedOverride: !!step.description, 
            depth: 0, // Add initial depth for main nodes
          },
          draggable: true,
          selectable: true,
        };
      });
      
      const newEdgesFromAI: Edge[] = [];
      if (newNodesFromAI.length > 1) {
        for (let i = 0; i < newNodesFromAI.length - 1; i++) {
          newEdgesFromAI.push({
            id: `e-${newNodesFromAI[i].id}-${newNodesFromAI[i+1].id}`,
            source: newNodesFromAI[i].id,
            target: newNodesFromAI[i+1].id,
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: 'hsl(var(--accent))',
            },
            style: {
              strokeWidth: 2,
              stroke: 'hsl(var(--accent))',
            }
          });
        }
      }
      
      setNodeIdCounter(newNodesCounter + result.roadmap.length);
      setNodes(newNodesFromAI); 
      setEdges(newEdgesFromAI);

      toast({
        title: 'Roadmap Generated!',
        description: `Created ${newNodesFromAI.length} steps for your project.`,
      });

    } catch (error) {
      console.error('Roadmap generation error:', error);
      let errorMessage = 'Failed to generate roadmap. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message.includes("output was null") 
          ? "AI failed to produce a valid roadmap structure. Try rephrasing your prompt." 
          : error.message.includes("roadmap array is missing")
          ? "AI output was invalid. Roadmap data is not correctly formatted."
          : error.message;
      }
      toast({
        title: 'Error Generating Roadmap',
        description: errorMessage,
        variant: 'destructive',
      });
      setNodes((nds) => nds.filter(node => node.id !== tempLoadingNodeId));
      setEdges([]);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    promptText, toast, reactFlowInstance, 
    nodeIdCounter, setNodeIdCounter,
    setNodes, setEdges,
    handleToggleNodeDone, handleUpdateNodeData, handleDeleteNode, 
    handleAddNodeAfter, handleManualToggleExpansion, handleUpdateNodeColor,
    handleGenerateSubRoadmapPrompt
  ]);

  useEffect(() => {
    const initialPromptFromQuery = searchParams.get('prompt');
    if (projectId === 'new' && initialPromptFromQuery && !generationAttempted.current) {
       if (nodes.length === 0 && !isLoading) {
        setPromptText(initialPromptFromQuery);
        doGenerateRoadmap(initialPromptFromQuery);
        generationAttempted.current = true;
      }
    } else if (projectId !== 'new' && initialPromptFromQuery) {
        setPromptText(initialPromptFromQuery); 
        generationAttempted.current = false;
    }
  }, [projectId, searchParams, doGenerateRoadmap, nodes.length, isLoading]);

  const handleNodeSelectFromSidebar = (nodeId: string) => {
    setSelectedNodeIdFromSidebar(nodeId);
    setNodes(nds => 
      nds.map(n => ({
        ...n,
        selected: n.id === nodeId,
      }))
    );
    const nodeToFocus = nodes.find(n => n.id === nodeId);
    if (nodeToFocus && reactFlowInstance) {
        reactFlowInstance.fitView({ nodes: [{ id: nodeId }], duration: 500, padding: 0.3 });
    }
  };

  const handleExpandAllNodes = () => {
    if (isLoading || nodes.length === 0) return;
    setGlobalExpansionOverride(true);
  };

  const handleCollapseAllNodes = () => {
    if (isLoading || nodes.length === 0) return;
    setGlobalExpansionOverride(false);
  };

  return (
    <SidebarProvider>
      <RoadmapSidebar 
        nodes={nodes}
        isLoading={isLoading}
        selectedNodeIdFromSidebar={selectedNodeIdFromSidebar}
        onNodeSelect={handleNodeSelectFromSidebar}
      />

      <SidebarInset className="flex flex-col h-screen">
        <ProjectHeader 
          promptText={promptText}
          onPromptTextChange={setPromptText}
          onGenerateRoadmap={() => doGenerateRoadmap()} 
          isLoading={isLoading}
          nodes={nodes}
          projectId={projectId}
          onExpandAll={handleExpandAllNodes}
          onCollapseAll={handleCollapseAllNodes}
          isMiniMapVisible={isMiniMapVisible}
          onToggleMiniMap={() => setIsMiniMapVisible(!isMiniMapVisible)}
        />
        
        <main className="flex-grow relative" aria-label="React Flow canvas area">
          <RoadmapCanvas 
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            isMiniMapVisible={isMiniMapVisible}
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function ProjectPage() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}

