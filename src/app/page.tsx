
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
} from 'reactflow';
import 'reactflow/dist/style.css';

import { WordNode, type WordNodeData } from '@/components/word-node';
import { generateRoadmap } from '@/ai/flows/generate-roadmap-flow';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  const [nodeIdCounter, setNodeIdCounter] = useState(0); // Used for unique ID generation for nodes
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
    if (reactFlowInstance && nodes.length > 0) {
      const timer = setTimeout(() => {
        reactFlowInstance.fitView({ duration: 300, padding: 0.2 });
      }, 150); 
      return () => clearTimeout(timer);
    }
  }, [nodes, reactFlowInstance]);

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
    
    // Clear existing nodes when generating a new roadmap
    // Or, you might want to append. For now, let's clear.
    // setNodes([]); 
    // setEdges([]);
    // If appending, ensure nodeIdCounter logic is robust or use UUIDs for roadmap step IDs from AI.

    // Add temporary loading nodes
    const tempLoadingNode: Node<WordNodeData> = {
      id: `loading_node_${nodeIdCounter}`,
      type: 'wordNode',
      position: { x: 50, y: 50 }, // Adjust as needed, or center it
      data: { title: 'Generating Roadmap...', isLoading: true },
      draggable: true,
      selectable: true,
    };
    setNodes([tempLoadingNode]); // Replace current nodes with a single loading node
    setNodeIdCounter(prev => prev + 1);


    try {
      const result = await generateRoadmap({ prompt: promptText });
      
      if (!result.roadmap || result.roadmap.length === 0) {
        toast({
          title: 'No Roadmap Generated',
          description: 'The AI did not return any roadmap steps. Try a different prompt.',
          variant: 'default',
        });
        setNodes((nds) => nds.filter(node => node.id !== tempLoadingNode.id)); // Remove loading node
        return;
      }

      const newNodes: Node<WordNodeData>[] = result.roadmap.map((step, index) => {
        const currentNodesCount = index; // Use index for positioning new batch
        const xPosition = (currentNodesCount % 3) * 280 + (Math.random() * 30 - 15) + 50; // 280 for wider nodes
        const yPosition = Math.floor(currentNodesCount / 3) * 200 + (Math.random() * 30 - 15) + 50; // 200 for taller nodes + desc

        return {
          id: `roadmapnode_${step.id}_${nodeIdCounter + index}`, // Ensure unique ID using AI's step.id and counter
          type: 'wordNode',
          position: { x: xPosition, y: yPosition },
          data: { title: step.title, description: step.description, isLoading: false },
          draggable: true,
          selectable: true,
        };
      });
      
      setNodeIdCounter(prev => prev + result.roadmap.length);
      setNodes(newNodes); // Replace loading node with actual roadmap nodes

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
      // Remove loading node on error
      setNodes((nds) => nds.filter(node => node.id !== tempLoadingNode.id));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground" aria-label="Roadmap Generation application main screen">
      <header className="p-4 border-b border-border shadow-sm bg-card">
        <div className="container mx-auto flex flex-col sm:flex-row items-center gap-4">
          <Input
            type="text"
            placeholder="Enter your project idea (e.g., build an apple tree farm)..."
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="flex-grow"
            disabled={isLoading}
            onKeyDown={(e) => { if (e.key === 'Enter' && !isLoading) handleGenerateRoadmap(); }}
            aria-label="Project idea input field"
          />
          <Button onClick={handleGenerateRoadmap} disabled={isLoading} className="w-full sm:w-auto shrink-0 px-6">
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
            {isLoading ? 'Generating...' : 'Generate Roadmap'}
          </Button>
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
        >
          <Controls 
            className="[&_button]:bg-card [&_button]:border-border [&_button:hover]:bg-muted [&_button_svg]:fill-foreground" 
            position="bottom-right"
          />
          <MiniMap 
            nodeStrokeWidth={3} 
            nodeColor={(node) => {
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
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
