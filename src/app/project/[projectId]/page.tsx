
"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
  type NodeTypes,
  MiniMap, 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';

import { WordNode, type WordNodeData } from '@/components/word-node';
import { generateRoadmap } from '@/ai/flows/generate-roadmap-flow';
import { generateSubRoadmap } from '@/ai/flows/generate-sub-roadmap-flow'; // Import new flow
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Maximize, Minimize, MapIcon, HomeIcon, GitBranch } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';

import { RoadmapSidebar } from '@/components/roadmap/RoadmapSidebar';
import { RoadmapCanvas } from '@/components/roadmap/RoadmapCanvas';


const nodeTypes: NodeTypes = {
  wordNode: WordNode,
};

const initialNodes: Node<WordNodeData>[] = [];
const initialEdges: Edge[] = [];

const DEFAULT_NODE_COLOR = '#A0A0A0'; 
const SUB_NODE_COLOR = '#C0C0C0'; // Slightly different color for sub-nodes

function FlowCanvas() {
  const [nodes, setNodes] = useState<Node<WordNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [promptText, setPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSubRoadmapForNodeId, setIsLoadingSubRoadmapForNodeId] = useState<string | null>(null);
  const [nodeIdCounter, setNodeIdCounter] = useState(0);
  const [selectedNodeIdFromSidebar, setSelectedNodeIdFromSidebar] = useState<string | null>(null);
  const [globalExpansionOverride, setGlobalExpansionOverride] = useState<boolean | null>(null);
  const [isMiniMapVisible, setIsMiniMapVisible] = useState(true);
  
  const generationAttempted = useRef(false);


  const { toast } = useToast();
  const reactFlowInstance = useReactFlow();
  const searchParams = useSearchParams(); 
  const params = useParams(); 
  const projectId = params.projectId as string;


  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  
  useEffect(() => {
    if (reactFlowInstance && (nodes.length > 0 || edges.length > 0) && !selectedNodeIdFromSidebar) {
      const timer = setTimeout(() => {
        reactFlowInstance.fitView({ duration: 300, padding: 0.2 });
      }, 150); 
      return () => clearTimeout(timer);
    }
  }, [nodes, edges, reactFlowInstance, selectedNodeIdFromSidebar]);


  const handleUpdateNodeColor = useCallback((nodeId: string, newColor: string) => {
    setNodes((prevNodes) => 
      prevNodes.map((node) => 
        node.id === nodeId ? { ...node, data: { ...node.data, color: newColor } } : node
      )
    );
  }, [setNodes]);

  const handleDeleteNode = useCallback((nodeIdToDelete: string) => {
    if (isLoading || isLoadingSubRoadmapForNodeId) return;
    const nodeToDelete = nodes.find(n => n.id === nodeIdToDelete);
    setNodes(nds => nds.filter(node => node.id !== nodeIdToDelete));
    setEdges(eds => eds.filter(edge => edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete));
    toast({ title: `Step "${nodeToDelete?.data?.title || 'Unknown'}" deleted.` });
  }, [nodes, setNodes, setEdges, toast, isLoading, isLoadingSubRoadmapForNodeId]);
  

  const handleManualToggleExpansion = useCallback((nodeId: string, explicitlyExpanded?: boolean) => {
    setGlobalExpansionOverride(null); 
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const currentExpansionState = node.data._isExpandedOverride !== undefined ? node.data._isExpandedOverride : !!node.data.description;
          const newExpandedState = explicitlyExpanded !== undefined ? explicitlyExpanded : !currentExpansionState;
          return {
            ...node,
            data: { 
              ...node.data, 
              _isExpandedOverride: newExpandedState,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  const handleToggleNodeDone = useCallback((nodeId: string) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id === nodeId) {
          const currentIsDone = node.data?.isDone ?? false;
          const newIsDone = !currentIsDone;
          
          let newOverrideState: boolean | undefined = node.data._isExpandedOverride; 

          if (globalExpansionOverride === null) { 
            if (newIsDone && node.data.description) { 
              newOverrideState = false; 
            }
          } else { 
             newOverrideState = globalExpansionOverride;
          }

          return {
            ...node,
            data: {
              ...node.data,
              isDone: newIsDone,
              _isExpandedOverride: newOverrideState,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes, globalExpansionOverride]);

  const handleUpdateNodeData = useCallback(
    (nodeId: string, updatedData: { title: string; description?: string }) => {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                title: updatedData.title,
                description: updatedData.description,
              },
            };
          }
          return node;
        })
      );
      toast({
          title: "Step Updated",
          description: `Step "${updatedData.title}" has been updated.`,
      });
    },
    [setNodes, toast]
  );

  const handleAddNodeAfter = useCallback((currentNodeId: string) => {
    if (isLoading || isLoadingSubRoadmapForNodeId) return;

    const newInternalId = `manualnode_${nodeIdCounter}`;
    setNodeIdCounter(prev => prev + 1);

    const currentNodeIndex = nodes.findIndex(n => n.id === currentNodeId);
    const currentNode = nodes[currentNodeIndex];

    if (!currentNode) {
        toast({ title: "Error", description: "Could not find the current node to add after.", variant: "destructive"});
        return;
    }
    
    const newNodePosition = {
        x: currentNode.position.x + 0, 
        y: currentNode.position.y + (currentNode.height || 150) + 60,
    };

    const newNode: Node<WordNodeData> = {
        id: newInternalId,
        type: 'wordNode',
        position: newNodePosition,
        data: {
            title: 'New Step',
            description: 'Double-click description to edit.',
            isDone: false,
            onToggleDone: handleToggleNodeDone,
            onUpdateNodeData: handleUpdateNodeData,
            onDeleteNode: handleDeleteNode,
            onAddNodeAfter: handleAddNodeAfter, // Still pass itself for recursion if needed
            onGenerateSubRoadmap: handleGenerateSubRoadmap, 
            onManualToggleExpansion: handleManualToggleExpansion,
            onUpdateNodeColor: handleUpdateNodeColor,
            color: DEFAULT_NODE_COLOR,
            _isExpandedOverride: globalExpansionOverride !== null ? globalExpansionOverride : true, 
        },
        draggable: true,
        selectable: true,
    };

    const newNodesArray = [...nodes];
    const newEdgesArray = [...edges];

    newNodesArray.splice(currentNodeIndex + 1, 0, newNode);

    const outgoingEdgeIndex = newEdgesArray.findIndex(edge => edge.source === currentNodeId);
    if (outgoingEdgeIndex !== -1) {
        const originalSuccessorId = newEdgesArray[outgoingEdgeIndex].target;
        newEdgesArray.splice(outgoingEdgeIndex, 1); 

        newEdgesArray.push({ 
            id: `e-${newNode.id}-${originalSuccessorId}`,
            source: newNode.id,
            target: originalSuccessorId,
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: 'hsl(var(--accent))' },
            style: { strokeWidth: 2, stroke: 'hsl(var(--accent))' },
        });
    }

    newEdgesArray.push({ 
        id: `e-${currentNodeId}-${newNode.id}`,
        source: currentNodeId,
        target: newNode.id,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: 'hsl(var(--accent))' },
        style: { strokeWidth: 2, stroke: 'hsl(var(--accent))' },
    });
    
    setNodes(newNodesArray);
    setEdges(newEdgesArray);

    toast({ title: "New step added!" });
    setTimeout(() => reactFlowInstance.fitView({nodes: [{id: newNode.id}], duration: 300, padding: 0.2}), 100);

  }, [
      isLoading, isLoadingSubRoadmapForNodeId, nodes, edges, nodeIdCounter, promptText,
      handleToggleNodeDone, handleUpdateNodeData, handleDeleteNode, 
      globalExpansionOverride, handleManualToggleExpansion, 
      handleUpdateNodeColor, setNodes, setEdges, toast, reactFlowInstance
      // Removed handleGenerateSubRoadmap from here
    ]);


  const handleGenerateSubRoadmap = useCallback(async (parentNodeId: string) => {
    if (isLoading || isLoadingSubRoadmapForNodeId) return;

    const parentNode = nodes.find(n => n.id === parentNodeId);
    if (!parentNode) {
      toast({ title: "Error", description: "Parent node not found.", variant: "destructive" });
      return;
    }
    if (!promptText.trim()) {
       toast({ title: "Error", description: "Main project prompt is missing. Please enter it at the top.", variant: "destructive" });
      return;
    }

    setIsLoadingSubRoadmapForNodeId(parentNodeId);
    toast({ title: "Generating Sub-Roadmap...", description: `Breaking down step: "${parentNode.data.title}"` });

    try {
      const result = await generateSubRoadmap({
        mainProjectPrompt: promptText,
        parentStepTitle: parentNode.data.title,
        parentStepDescription: parentNode.data.description,
      });

      if (!result.subRoadmap || result.subRoadmap.length === 0) {
        toast({
          title: 'No Sub-Roadmap Generated',
          description: 'The AI did not return any sub-steps. Try a different parent step or refine the main prompt.',
        });
        setIsLoadingSubRoadmapForNodeId(null);
        return;
      }

      const parentNodeIndex = nodes.findIndex(n => n.id === parentNodeId);
      const newSubNodes: Node<WordNodeData>[] = result.subRoadmap.map((step, index) => {
        const newId = `subnode_${parentNodeId}_${step.id}_${nodeIdCounter + index}`;
        return {
          id: newId,
          type: 'wordNode',
          position: { 
            x: parentNode.position.x + 30, // Indent sub-nodes
            y: parentNode.position.y + (parentNode.height || 150) + 70 + (index * 100) // Stack vertically
          },
          data: {
            title: `Sub: ${step.title}`,
            description: step.description,
            isDone: false,
            isSubStep: true, // Mark as sub-step
            onToggleDone: handleToggleNodeDone,
            onUpdateNodeData: handleUpdateNodeData,
            onDeleteNode: handleDeleteNode,
            onAddNodeAfter: handleAddNodeAfter,
            onGenerateSubRoadmap: handleGenerateSubRoadmap, // Still pass itself
            onManualToggleExpansion: handleManualToggleExpansion,
            onUpdateNodeColor: handleUpdateNodeColor,
            color: SUB_NODE_COLOR,
            _isExpandedOverride: !!step.description,
          },
          draggable: true,
          selectable: true,
        };
      });
      
      setNodeIdCounter(prev => prev + result.subRoadmap.length);

      let newEdgesArray = [...edges];
      const originalOutgoingEdge = newEdgesArray.find(edge => edge.source === parentNodeId);
      const originalSuccessorId = originalOutgoingEdge?.target;

      // Remove original outgoing edge from parent
      if (originalOutgoingEdge) {
        newEdgesArray = newEdgesArray.filter(edge => edge.id !== originalOutgoingEdge.id);
      }

      // Connect parent to first sub-node
      newEdgesArray.push({
        id: `e-${parentNodeId}-${newSubNodes[0].id}`,
        source: parentNodeId,
        target: newSubNodes[0].id,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: 'hsl(var(--accent))' },
        style: { strokeWidth: 1.5, stroke: 'hsl(var(--accent))' },
      });

      // Connect sub-nodes sequentially
      for (let i = 0; i < newSubNodes.length - 1; i++) {
        newEdgesArray.push({
          id: `e-${newSubNodes[i].id}-${newSubNodes[i+1].id}`,
          source: newSubNodes[i].id,
          target: newSubNodes[i+1].id,
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: 'hsl(var(--accent))' },
          style: { strokeWidth: 1.5, stroke: 'hsl(var(--accent))' },
        });
      }

      // Connect last sub-node to original successor (if any)
      if (originalSuccessorId) {
        newEdgesArray.push({
          id: `e-${newSubNodes[newSubNodes.length - 1].id}-${originalSuccessorId}`,
          source: newSubNodes[newSubNodes.length - 1].id,
          target: originalSuccessorId,
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: 'hsl(var(--accent))' },
          style: { strokeWidth: 1.5, stroke: 'hsl(var(--accent))' },
        });
      }
      
      // Insert new nodes into the nodes array
      const updatedNodes = [
        ...nodes.slice(0, parentNodeIndex + 1),
        ...newSubNodes,
        ...nodes.slice(parentNodeIndex + 1)
      ];

      setNodes(updatedNodes);
      setEdges(newEdgesArray);

      toast({
        title: 'Sub-Roadmap Generated!',
        description: `Added ${newSubNodes.length} sub-steps for "${parentNode.data.title}".`,
      });
      setTimeout(() => reactFlowInstance.fitView({ duration: 500, padding: 0.2 }), 100);

    } catch (error) {
      console.error('Sub-roadmap generation error:', error);
      let errorMessage = 'Failed to generate sub-roadmap. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: 'Error Generating Sub-Roadmap',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSubRoadmapForNodeId(null);
    }
  }, [
    nodes, edges, nodeIdCounter, promptText, 
    handleToggleNodeDone, handleUpdateNodeData, handleDeleteNode,
    handleManualToggleExpansion, handleUpdateNodeColor, 
    toast, reactFlowInstance, isLoading, isLoadingSubRoadmapForNodeId
    // Removed handleAddNodeAfter from here
  ]);


  const handleDeleteSelectedNodes = useCallback(() => {
    if (isLoading || isLoadingSubRoadmapForNodeId) return;
    const selectedNodeIds = nodes.filter(n => n.selected).map(n => n.id);
    if (selectedNodeIds.length === 0) return;

    setNodes(nds => nds.filter(node => !node.selected));
    setEdges(eds => eds.filter(edge => !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)));
    toast({ title: `${selectedNodeIds.length} step(s) deleted.` });
  }, [isLoading, isLoadingSubRoadmapForNodeId, nodes, setNodes, setEdges, toast]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isLoading || isLoadingSubRoadmapForNodeId) return;
      if (event.key === 'Delete' || (event.key === 'x' && (event.ctrlKey || event.metaKey))) {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          if (event.key === 'x' && (event.ctrlKey || event.metaKey)) {
            return; 
          }
        }
        if (event.key === 'x' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
        }
        handleDeleteSelectedNodes();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleDeleteSelectedNodes, isLoading, isLoadingSubRoadmapForNodeId]);

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
    
    const tempLoadingNodeId = `loading_node_${nodeIdCounter}`;
    const tempLoadingNode: Node<WordNodeData> = {
      id: tempLoadingNodeId,
      type: 'wordNode',
      position: { x: 50, y: 50 }, 
      data: { 
        title: 'Generating Roadmap...', 
        isLoading: true, 
        onToggleDone: handleToggleNodeDone,
        onUpdateNodeData: handleUpdateNodeData,
        onDeleteNode: handleDeleteNode,
        onAddNodeAfter: handleAddNodeAfter,
        onGenerateSubRoadmap: handleGenerateSubRoadmap, 
        onManualToggleExpansion: handleManualToggleExpansion,
        onUpdateNodeColor: handleUpdateNodeColor,
      },
      draggable: true,
      selectable: true,
    };
    setNodes([tempLoadingNode]);
    setEdges([]); 
    setNodeIdCounter(prev => prev + 1);


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

      const newNodes: Node<WordNodeData>[] = result.roadmap.map((step, index) => {
        const currentNodesCount = index; 
        const xPosition = (currentNodesCount % 3) * 280 + (Math.random() * 30 - 15) + 50; 
        const yPosition = Math.floor(currentNodesCount / 3) * 200 + (Math.random() * 30 - 15) + 50;

        return {
          id: `roadmapnode_${step.id}_${nodeIdCounter + index}`, 
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
            onGenerateSubRoadmap: handleGenerateSubRoadmap, 
            onManualToggleExpansion: handleManualToggleExpansion,
            onUpdateNodeColor: handleUpdateNodeColor, 
            color: DEFAULT_NODE_COLOR, 
            _isExpandedOverride: !!step.description, 
          },
          draggable: true,
          selectable: true,
        };
      });
      
      const newEdges: Edge[] = [];
      if (newNodes.length > 1) {
        for (let i = 0; i < newNodes.length - 1; i++) {
          newEdges.push({
            id: `e-${newNodes[i].id}-${newNodes[i+1].id}`,
            source: newNodes[i].id,
            target: newNodes[i+1].id,
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
      
      setNodeIdCounter(prev => prev + result.roadmap.length);
      setNodes(newNodes); 
      setEdges(newEdges);

      toast({
        title: 'Roadmap Generated!',
        description: `Created ${newNodes.length} steps for your project.`,
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
  }, [promptText, nodeIdCounter, toast, reactFlowInstance, handleToggleNodeDone, handleUpdateNodeData, handleDeleteNode, handleAddNodeAfter, handleManualToggleExpansion, handleUpdateNodeColor, handleGenerateSubRoadmap]);

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
    reactFlowInstance.fitView({ nodes: [{ id: nodeId }], duration: 500, padding: 0.3 });
  };

  const handleExpandAllNodes = () => {
    if (isLoading || nodes.length === 0 || isLoadingSubRoadmapForNodeId) return;
    setGlobalExpansionOverride(true);
  };

  const handleCollapseAllNodes = () => {
    if (isLoading || nodes.length === 0 || isLoadingSubRoadmapForNodeId) return;
    setGlobalExpansionOverride(false);
  };

  useEffect(() => {
    if (globalExpansionOverride !== null) {
      setNodes(nds => nds.map(n => {
        if (n.data.isLoading) return n; 
        if (!n.data.description) return { ...n, data: { ...n.data, _isExpandedOverride: false } };
        return { ...n, data: { ...n.data, _isExpandedOverride: globalExpansionOverride } };
      }));
    }
  }, [globalExpansionOverride, nodes.length, setNodes]); 


  return (
    <SidebarProvider>
      <RoadmapSidebar 
        nodes={nodes}
        isLoading={isLoading || !!isLoadingSubRoadmapForNodeId}
        selectedNodeIdFromSidebar={selectedNodeIdFromSidebar}
        onNodeSelect={handleNodeSelectFromSidebar}
      />

      <SidebarInset className="flex flex-col h-screen">
        <header className="p-4 border-b border-border shadow-sm bg-card sticky top-0 z-50">
          <div className="container mx-auto flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <Link href="/" passHref>
              <Button variant="outline" size="icon" title="Back to Home" className="shrink-0 p-2 h-10 w-10">
                <HomeIcon className="h-5 w-5" />
              </Button>
            </Link>
            <Input
              type="text"
              placeholder="Your project idea..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="flex-grow min-w-0 h-10"
              disabled={isLoading || !!isLoadingSubRoadmapForNodeId}
              onKeyDown={(e) => { if (e.key === 'Enter' && !isLoading && !isLoadingSubRoadmapForNodeId) doGenerateRoadmap(); }}
              aria-label="Project idea input field"
            />
            <Button onClick={() => doGenerateRoadmap()} disabled={isLoading || !!isLoadingSubRoadmapForNodeId} className="w-full sm:w-auto shrink-0 px-4 h-10">
              {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
              {isLoading ? 'Generating...' : (nodes.length > 0 ? 'Regenerate' : 'Generate Roadmap')}
            </Button>
            <div className="sm:ml-auto flex items-center gap-1 self-center sm:self-auto mt-2 sm:mt-0">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleExpandAllNodes} 
                disabled={isLoading || !!isLoadingSubRoadmapForNodeId || nodes.length === 0 || nodes.every(n => n.data.isLoading || !n.data.description)}
                title="Expand All Descriptions"
                aria-label="Expand all node descriptions"
                className="h-10 w-10"
              >
                <Maximize className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleCollapseAllNodes}
                disabled={isLoading || !!isLoadingSubRoadmapForNodeId || nodes.length === 0 || nodes.every(n => n.data.isLoading || !n.data.description)}
                title="Collapse All Descriptions"
                aria-label="Collapse all node descriptions"
                className="h-10 w-10"
              >
                <Minimize className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setIsMiniMapVisible(!isMiniMapVisible)}
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
        
        <main className="flex-grow relative" aria-label="React Flow canvas area">
          <RoadmapCanvas 
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            isMiniMapVisible={isMiniMapVisible}
          />
           {isLoadingSubRoadmapForNodeId && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20">
              <Loader2 className="h-12 w-12 animate-spin text-accent" />
            </div>
          )}
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

