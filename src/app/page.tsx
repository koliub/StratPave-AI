
"use client";

import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  MiniMap,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { WordNode, type WordNodeData } from '@/components/word-node';
import { generateRoadmap } from '@/ai/flows/generate-roadmap-flow';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, ListTree } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';


const nodeTypes = {
  wordNode: WordNode,
};

const initialNodes: Node<WordNodeData>[] = [];
const initialEdges: Edge[] = [];

function FlowCanvas() {
  const [nodes, setNodes] = useState<Node<WordNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [promptText, setPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nodeIdCounter, setNodeIdCounter] = useState(0);
  const [selectedNodeIdFromSidebar, setSelectedNodeIdFromSidebar] = useState<string | null>(null);
  const { toast } = useToast();
  const reactFlowInstance = useReactFlow();

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

  const handleDeleteNode = useCallback((nodeIdToDelete: string) => {
    if (isLoading) return;
    const nodeToDelete = nodes.find(n => n.id === nodeIdToDelete);
    setNodes(nds => nds.filter(node => node.id !== nodeIdToDelete));
    setEdges(eds => eds.filter(edge => edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete));
    toast({ title: `Step "${nodeToDelete?.data?.title || 'Unknown'}" deleted.` });
  }, [nodes, setNodes, setEdges, toast, isLoading]);
  

  const handleManualToggleExpansion = useCallback((nodeId: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId && node.data._isExpandedOverride !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { _isExpandedOverride, ...restData } = node.data;
          return {
            ...node,
            data: { ...restData }, // Clear the override
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
          
          let newOverrideState: boolean | undefined = undefined; 

          if (newIsDone && node.data.description) {
            newOverrideState = false; // Auto-collapse if marked done and has description
          }
          // If unmarking as done (newIsDone is false), newOverrideState remains undefined,
          // effectively clearing any previous override, letting the node use its internal state.

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
  }, [setNodes]);

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
    if (isLoading) return;

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
            onAddNodeAfter: handleAddNodeAfter,
            onManualToggleExpansion: handleManualToggleExpansion, 
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

  }, [isLoading, nodes, edges, nodeIdCounter, handleToggleNodeDone, handleUpdateNodeData, handleDeleteNode, handleManualToggleExpansion, setNodes, setEdges, toast, reactFlowInstance]);


  const handleDeleteSelectedNodes = useCallback(() => {
    if (isLoading) return;
    const selectedNodeIds = nodes.filter(n => n.selected).map(n => n.id);
    if (selectedNodeIds.length === 0) return;

    setNodes(nds => nds.filter(node => !node.selected));
    setEdges(eds => eds.filter(edge => !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)));
    toast({ title: `${selectedNodeIds.length} step(s) deleted.` });
  }, [isLoading, nodes, setNodes, setEdges, toast]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isLoading) return;
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
  }, [handleDeleteSelectedNodes, isLoading]);


  const handleGenerateRoadmap = async () => {
    if (!promptText.trim()) {
      toast({
        title: 'Prompt is empty',
        description: 'Please enter your project idea to generate a roadmap.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setSelectedNodeIdFromSidebar(null); 
    
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
        onManualToggleExpansion: handleManualToggleExpansion,
      },
      draggable: true,
      selectable: true,
    };
    setNodes([tempLoadingNode]);
    setEdges([]); 
    setNodeIdCounter(prev => prev + 1);


    try {
      const result = await generateRoadmap({ prompt: promptText });
      
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
            onManualToggleExpansion: handleManualToggleExpansion,
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
  };

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

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" side="left">
        <SidebarHeader className="p-2">
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
              {nodes.filter(n => !n.data.isLoading).map((node) => (
                <li key={node.id}>
                  <Button
                    variant={selectedNodeIdFromSidebar === node.id ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start text-left h-auto py-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8",
                      node.data.isDone && "line-through opacity-70"
                    )}
                    onClick={() => handleNodeSelectFromSidebar(node.id)}
                    title={node.data.title}
                  >
                    <span className="group-data-[collapsible=icon]:hidden truncate">
                      {node.data.title}
                    </span>
                    <span className="hidden group-data-[collapsible=icon]:inline">
                      {node.data.title.substring(0,1).toUpperCase()}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="flex flex-col h-screen">
        <header className="p-4 border-b border-border shadow-sm bg-card">
          <div className="container mx-auto flex flex-col sm:flex-row items-center gap-4">
            <SidebarTrigger className="sm:hidden" /> {/* Mobile only trigger */}
            <Input
              type="text"
              placeholder="Enter your project idea (e.g., build an apple tree farm)..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="flex-grow min-w-0"
              disabled={isLoading}
              onKeyDown={(e) => { if (e.key === 'Enter' && !isLoading) handleGenerateRoadmap(); }}
              aria-label="Project idea input field"
            />
            <Button onClick={handleGenerateRoadmap} disabled={isLoading} className="w-full sm:w-auto shrink-0 px-6">
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
              {isLoading ? 'Generating...' : 'Generate Roadmap'}
            </Button>
            <div className="sm:ml-auto flex items-center gap-2">
              <ThemeToggle />
              <SidebarTrigger className="hidden sm:flex" /> {/* Desktop trigger */}
            </div>
          </div>
        </header>
        
        <main className="flex-grow relative" aria-label="React Flow canvas area">
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
            <MiniMap 
              nodeStrokeWidth={3} 
              nodeColor={(node) => {
                if (node.type === 'wordNode' && node.data.isLoading) return 'hsl(var(--muted-foreground))';
                if (node.type === 'wordNode' && node.data.isDone) return 'hsl(var(--success))';
                if (node.type === 'wordNode') return 'hsl(var(--accent))';
                return 'hsl(var(--muted-foreground))'; 
              }} 
              pannable 
              zoomable 
              className="!bg-card border border-border rounded-md shadow-lg"
              ariaLabel="Minimap for canvas navigation"
            />
            <Background variant="dots" gap={16} size={1} color="hsl(var(--border))" />
          </ReactFlow>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function RoadmapPage() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
