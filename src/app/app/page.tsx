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
import { useRouter, useSearchParams } from 'next/navigation';

import { WordNode, type WordNodeData } from '@/components/roadmap/word-node';
import { generateRoadmap } from '@/ai/flows/generate-roadmap-flow';
import { useToast } from '@/hooks/use-toast';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { getProjectFromDb, saveProjectToDb } from '@/lib/firebase'; // Import Firestore functions

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
  const [projectLoaded, setProjectLoaded] = useState(false); // New state to track if project is loaded
  
  const generationAttempted = useRef(false);
  const { toast } = useToast();
  const reactFlowInstance = useReactFlow();
  const searchParams = useSearchParams(); 
  const router = useRouter(); // Import useRouter
  const projectId = searchParams.get('projectId'); // Get projectId from search params
  const { user, loading: userLoading } = useAuth(); // Get user and loading state

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

  // Effect to fit view on nodes/edges change
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
      
      let newNodesCounter = 0; // Start counter from 0 for new generation
      const newNodesFromAI: Node<WordNodeData>[] = result.roadmap.map((step, index) => {
        const currentNodesCount = index;
        const xPosition = (currentNodesCount % 3) * 280 + (Math.random() * 30 - 15) + 50;
        const yPosition = Math.floor(currentNodesCount / 3) * 200 + (Math.random() * 30 - 15) + 50;
        // Generate a more stable ID based on step ID and index
        const nodeId = `roadmapnode_${step.id.replace(/\s+/g, '_').toLowerCase()}_${index}`;
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
            id: `e-${newNodesFromAI[i].id}-${newNodesFromAI[i + 1].id}`,
            source: newNodesFromAI[i].id,
            target: newNodesFromAI[i + 1].id,
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
            },
          });
        }
      }

      setNodeIdCounter(newNodesFromAI.length); // Set counter based on the number of generated nodes
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
    setNodeIdCounter, // Removed nodeIdCounter from deps as it's managed internally now
    setNodes, setEdges,
    handleToggleNodeDone, handleUpdateNodeData, handleDeleteNode,
    handleAddNodeAfter, handleManualToggleExpansion, handleUpdateNodeColor,
    handleGenerateSubRoadmapPrompt
  ]);

  // Effect to handle loading project from DB or triggering generation
  useEffect(() => {
    if (userLoading) return; // Wait for user authentication state to load

    // Case 1: Load existing project if projectId exists and is not 'new'
    if (projectId && projectId !== 'new') {
      if (user?.uid) {
        if (!projectLoaded) { // Only load if not already loaded
          setIsLoading(true);
          getProjectFromDb(user.uid, projectId)
            .then(projectData => {
              if (projectData) {
                setNodes(projectData.nodes || []);
                setEdges(projectData.edges || []);
                setPromptText(projectData.prompt || '');
                // Determine the highest existing node ID to set the counter
                const maxNodeId = projectData.nodes.reduce((max: number, node: Node<WordNodeData>) => {
                  // Assuming node IDs are in the format 'somenode_number'
                  const idParts = node.id.split('_');
                  const numberPart = parseInt(idParts[idParts.length - 1]);
                  return isNaN(numberPart) ? max : Math.max(max, numberPart);
                }, 0);
                setNodeIdCounter(maxNodeId + 1);
                setProjectLoaded(true);
                toast({
                  title: 'Project Loaded',
                  description: `Loaded project with ID: ${projectId}`,
                });
              } else {
                // Project not found or not accessible
                toast({
                  title: 'Project Not Found',
                  description: `Project with ID ${projectId} not found or you don't have access.`, 
                  variant: 'destructive',
                });
                // Optionally redirect to a new project page or dashboard
                router.push('/app');
              }
            })
            .catch(error => {
              console.error('Error loading project:', error);
              toast({
                title: 'Error Loading Project',
                description: 'Failed to load project. Please try again.',
                variant: 'destructive',
              });
              // Optionally redirect to a new project page or dashboard
              router.push('/app');
            })
            .finally(() => {
              setIsLoading(false);
            });
        }
      } else if (!user) {
        // User is not logged in, cannot load project
        toast({
          title: 'Authentication Required',
          description: 'Please log in to access this project.',
          variant: 'destructive',
        });
        router.push('/auth'); // Redirect to login page
      }
    }
    // Case 2: New project creation or generation from prompt if no projectId or projectId is 'new' AND no project is loaded yet
    else if ((!projectId || projectId === 'new') && !projectLoaded && !generationAttempted.current) {
      const storedPrompt = sessionStorage.getItem('roadmapPrompt');
      const initialPromptFromQuery = searchParams.get('prompt');

      if (storedPrompt) {
        setPromptText(storedPrompt);
        doGenerateRoadmap(storedPrompt);
        sessionStorage.removeItem('roadmapPrompt'); // Clean up sessionStorage
        generationAttempted.current = true;
      } else if (initialPromptFromQuery && projectId === 'new') {
        setPromptText(initialPromptFromQuery);
        doGenerateRoadmap(initialPromptFromQuery);
        generationAttempted.current = true;
      } else if (!initialPromptFromQuery && !storedPrompt && projectId === 'new') {
        // If it's a new project with no prompt, maybe initialize an empty canvas?
        // For now, let's do nothing and wait for user input or remove the 'new' projectId
        // or redirect if this state shouldn't be reachable.
        console.log("New project requested with no prompt.");
        setProjectLoaded(true); // Consider it loaded as an empty project
      } else if (!initialPromptFromQuery && !storedPrompt && !projectId) {
        // No project ID, no stored prompt, no query prompt - just an empty canvas
        console.log("Starting with an empty canvas.");
        setProjectLoaded(true); // Consider it loaded as an empty project
      }
    }
  }, [projectId, user, userLoading, projectLoaded, router, toast, setNodes, setEdges, setPromptText, setNodeIdCounter, doGenerateRoadmap, searchParams]);


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

  const handleSaveRoadmap = useCallback(async () => {
    if (!user?.uid) {
      toast({
        title: 'Authentication Required',
        description: 'Log in to save your project.',
        variant: 'destructive',
      });
      return null;
    }

    setIsLoading(true);
    try {
      // Create a clean object for node data, excluding functions
      const nodesToSave = nodes.map(node => {
        const dataToSave: Partial<WordNodeData> = {};
        for (const key in node.data) {
          // Check if the property is not a function before including it
          if (typeof (node.data as any)[key] !== 'function') {
            (dataToSave as any)[key] = (node.data as any)[key];
          }
        }

        // Preserve other node properties like id, type, position
        const { data, ...restNodeProps } = node;

        return {
          ...restNodeProps,
          data: dataToSave,
        };
      });

      const projectToSave = {
        nodes: nodesToSave,
        edges: edges,
        prompt: promptText,
      };

      const savedProjectId = await saveProjectToDb(user.uid, projectId || null, projectToSave);

      toast({
        title: 'Project Saved',
        description: 'Your roadmap has been saved.',
      });

      // If it was a new project, navigate to the URL with the new ID
      if (projectId === 'new' && savedProjectId) {
        router.replace(`/app?projectId=${savedProjectId}`);
      }

      return savedProjectId;

    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: 'Error Saving Project',
        description: 'Failed to save project. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, projectId, nodes, edges, promptText, toast, router]);


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
          projectTitle={promptText || 'Untitled Project'} // Use prompt as title initially
          nodes={nodes}
          projectId={projectId || 'new'} // Pass projectId to header
          onExpandAll={handleExpandAllNodes}
          onCollapseAll={handleCollapseAllNodes}
          isMiniMapVisible={isMiniMapVisible}
          onToggleMiniMap={() => setIsMiniMapVisible(!isMiniMapVisible)}
          onProjectTitleChange={setPromptText} // Allow changing title
          onSaveRoadmap={handleSaveRoadmap} // Pass save function
          isLoading={isLoading}
          isUserLoggedIn={!!user}
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

