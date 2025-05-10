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
import { summarizePrompt } from '@/ai/flows/summarize-prompt';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const nodeTypes = {
  wordNode: WordNode,
};

const initialNodes: Node<WordNodeData>[] = [
  {
    id: '1',
    type: 'wordNode',
    position: { x: 0, y: 0 }, // Centered by fitView initially
    data: { label: 'Enter prompt', isLoading: false },
    draggable: true,
    selectable: true,
  },
];

const initialEdges: Edge[] = [];

function FlowCanvas() {
  const [nodes, setNodes] = useState<Node<WordNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [promptText, setPromptText] = useState(''); // Renamed to avoid conflict with AI flow import
  const [isLoading, setIsLoading] = useState(false);
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
    // Ensure fitView is called after the instance is available
    if (reactFlowInstance) {
      // A small delay can help ensure the layout is stable before fitting
      const timer = setTimeout(() => {
        reactFlowInstance.fitView({ duration: 200, padding: 0.3 });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [reactFlowInstance]);


  const handleSummarize = async () => {
    if (!promptText.trim()) {
      toast({
        title: 'Prompt is empty',
        description: 'Please enter a prompt to summarize.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setNodes((nds) =>
      nds.map((node) =>
        node.id === '1' ? { ...node, data: { ...node.data, isLoading: true, label: 'Processing...' } } : node
      )
    );

    try {
      const result = await summarizePrompt({ prompt: promptText });
      setNodes((nds) =>
        nds.map((node) =>
          node.id === '1'
            ? { ...node, draggable: true, selectable: true, data: { label: result.singleWord, isLoading: false } }
            : node
        )
      );
      if (reactFlowInstance) {
        // Small delay to allow node to re-render with new text before fitting view
        setTimeout(() => {
            reactFlowInstance.fitView({ duration: 300, padding: 0.3 });
        }, 100);
      }
    } catch (error) {
      console.error('Summarization error:', error);
      toast({
        title: 'Error',
        description: 'Failed to summarize prompt. Please try again.',
        variant: 'destructive',
      });
      setNodes((nds) =>
        nds.map((node) =>
          node.id === '1' ? { ...node, data: { ...node.data, isLoading: false, label: 'Error!' } } : node
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground" aria-label="Word Node application main screen">
      <header className="p-4 border-b border-border shadow-sm bg-card">
        <div className="container mx-auto flex flex-col sm:flex-row items-center gap-4">
          <Input
            type="text"
            placeholder="Enter your prompt here..."
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="flex-grow"
            disabled={isLoading}
            onKeyDown={(e) => { if (e.key === 'Enter' && !isLoading) handleSummarize(); }}
            aria-label="Prompt input field"
          />
          <Button onClick={handleSummarize} disabled={isLoading} className="w-full sm:w-32 shrink-0">
            {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Summarize'}
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
          fitView
          fitViewOptions={{ padding: 0.3, duration: 200 }} // Increased padding
          className="bg-background"
          proOptions={{ hideAttribution: true }} // Hide React Flow attribution for cleaner look
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

export default function WordNodePage() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}
