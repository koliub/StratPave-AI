"use client";
import { useLayoutEffect } from 'react';
import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
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
import { WordNode, type WordNodeData } from '@/app/canvas/components/word-node'; // Import WordNode and its data type
import { generateRoadmap } from '@/ai/RoadmapNodeGen';
import { useToast } from '@/hooks/use-toast';

import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { getProjectFromDb, saveProjectToDb } from '@/lib/db/projects'; // Import DB functions
import { toStorableNodes } from '@/lib/project-utils';

import { RoadmapSidebar } from '@/app/canvas/components/RoadmapSidebar';
import { RoadmapCanvas } from '@/app/canvas/components/RoadmapCanvas';
import { ProjectHeader } from '@/app/canvas/components/ProjectHeader';
import { useNodeManagement } from '@/hooks/useNodeManagement';

const nodeTypes: NodeTypes = {
  wordNode: WordNode,
};

const DEFAULT_NODE_COLOR = '#A0A0A0';

function FlowCanvas() {
  {/* State Management */}
  // UI States
  const [promptText, setPromptText] = useState('');
  const [projectTitle, setProjectTitle] = useState(''); // New state for project title
  const [isLoading, setIsLoading] = useState(false); 
  const [selectedNodeIdFromSidebar, setSelectedNodeIdFromSidebar] = useState<string | null>(null);
  const [globalExpansionOverride, setGlobalExpansionOverride] = useState<boolean | null>(null);
  const [isMiniMapVisible, setIsMiniMapVisible] = useState(true);
  const [projectLoaded, setProjectLoaded] = useState(false); // New state to track if project is loaded
  const [triggerFitView, setTriggerFitView] = useState(false); // State to trigger fitView

  
  {/* Hooks and Contexts */}
  // Utility hooks
  const generationAttempted = useRef(false);
  const { toast } = useToast();
  const reactFlowInstance = useReactFlow();
  const searchParams = useSearchParams(); 
  const router = useRouter(); // Import useRouter
  const projectIdFromUrl = searchParams.get('id'); // Get projectId from search params
  const { user, loading: userLoading } = useAuth(); // Get user and loading state
  // Custom hook for node/edge management

  // State to hold the current project ID, updated after saving a new project
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(projectIdFromUrl);

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
    handleGenerateSubRoadmap,
  } = useNodeManagement({ // This hook should ideally return these functions
    isLoading: isLoading,
    reactFlowInstance: reactFlowInstance,
    globalExpansionOverride: globalExpansionOverride,
    projectPrompt: promptText, // Pass promptText here
  });

  {/* ------------------------------ */}
  {/* Effects */}
  // Effect to fit view on nodes/edges change
  const prevNodesRef = useRef<Node[]>([]);


useLayoutEffect(() => {
  if (reactFlowInstance && triggerFitView) {
    setTimeout(() => {
      reactFlowInstance.fitView();
    }, 0); // delay to allow layout pass
    setTriggerFitView(false);
  }
}, [triggerFitView, reactFlowInstance]);


 // Add beforeunload event listener for unsaved changes
 useEffect(() => {
 const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // You'll need a way to track if there are unsaved changes.
      // For now, this will trigger on every navigation away.
 event.preventDefault();
 event.returnValue = ''; // Required for Chrome
    };

 window.addEventListener('beforeunload', handleBeforeUnload);

 return () => {
 window.removeEventListener('beforeunload', handleBeforeUnload);
    };
 }, []); // Add dependencies if you implement an unsaved changes tracking mechanism

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
  
    const tempId = `loading_node_${nodeIdCounter}`;
    const loadingNode: Node<WordNodeData> = {
      id: tempId,
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
        onGenerateSubRoadmap: handleGenerateSubRoadmap,
        onManualToggleExpansion: handleManualToggleExpansion,
        onUpdateNodeColor: handleUpdateNodeColor,
      },
      draggable: true,
      selectable: true,
    };
  
    setNodes([loadingNode]);
    setEdges([]);
    setTriggerFitView(true); // Trigger fitView after loading node is set

    setNodeIdCounter(nodeIdCounter + 1);

  
    try {
      const jsonResult = await generateRoadmap({ prompt: promptToUse });
      if (!jsonResult) {
        toast({
          title: 'No Roadmap Generated',
          description: 'The AI did not return any roadmap steps. Try a different prompt.',
        });
        setNodes((nds) => nds.filter(n => n.id !== tempId));
        return;
      }
  
      let result;
      try {
        result = JSON.parse(jsonResult);
      } catch (err) {
        console.error("Failed to parse AI response as JSON:", err);
        toast({
          title: 'Invalid AI Output',
          description: 'The AI returned invalid JSON. Try rephrasing your prompt.',
          variant: 'destructive',
        });
        setNodes((nds) => nds.filter(n => n.id !== tempId));
        return;
      }
  
      setProjectTitle(result.projectTitle || promptToUse);
  
      const newNodes: Node<WordNodeData>[] = result.roadmap.map((step: any, index: any) => {
        const pos = {
          x: index * 300 + 50, // Simple horizontal spacing
          y: 50,
        };
        return {
          id: `roadmapnode_${step.id.replace(/\s+/g, '_').toLowerCase()}_${index}`,
          type: 'wordNode',
          position: pos,
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
            depth: 0,
          },
          draggable: true,
          selectable: true,
        };
      });
  
      const newEdges: Edge[] = newNodes.slice(0, -1).map((node, i) => ({
        id: `e-${node.id}-${newNodes[i + 1].id}`,
        source: node.id,
        target: newNodes[i + 1].id,
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
      }));
  
      setNodeIdCounter(newNodes.length);
      setNodes(newNodes);
      setEdges(newEdges); // Consider adding setEdges to deps if it affects layout significantly
      setTriggerFitView(true);

      toast({
        title: 'Roadmap Generated!',
        description: `Created ${newNodes.length} steps for your project.`,
      });
  
    } catch (error) {
      console.error('Roadmap generation error:', error);
      const msg = error instanceof Error
        ? error.message.includes("output was null")
          ? "AI failed to produce a valid roadmap structure. Try rephrasing your prompt."
          : error.message.includes("roadmap array is missing")
            ? "AI output was invalid. Roadmap data is not correctly formatted."
            : error.message
        : 'Failed to generate roadmap. Please try again.';
  
      toast({
        title: 'Error Generating Roadmap',
        description: msg,
        variant: 'destructive',
      });
      setNodes((nds) => nds.filter(n => n.id !== tempId));
      setEdges([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    promptText, toast, reactFlowInstance,
    setNodeIdCounter, setNodes, setEdges, setProjectTitle,
    handleToggleNodeDone, handleUpdateNodeData, handleDeleteNode,
    handleAddNodeAfter, handleManualToggleExpansion, handleUpdateNodeColor,
   
  ]);
  

  // Function to generate a sub-roadmap for a given node

  const projectLoadAttempted = useRef(false);
  // Effect to handle loading project from DB or triggering generation
  useEffect(() => {
 console.log('useEffect triggered');
 console.log('userLoading:', userLoading);
 if (userLoading || projectLoadAttempted.current) return; // Wait for user authentication state to load
 console.log('user loaded or not loading');

    // Case 1: Load existing project if currentProjectId exists and is not 'new'
    if (currentProjectId && currentProjectId !== 'new') {
      console.log('Case 1: Loading existing project', currentProjectId);
  
      if (user?.uid) {
        projectLoadAttempted.current = true; // 🛑 Set this early so no duplicate fetch happens
  
        setIsLoading(true);
        getProjectFromDb(user.uid, currentProjectId)
          .then(projectData => {
            if (projectData) {
              console.log('Project data loaded successfully');
              const nodesWithHandlers = (projectData.nodes || []).map((node: any) => ({
                ...node,
                data: {
                  ...node.data,
                  onToggleDone: handleToggleNodeDone,
                  onUpdateNodeData: handleUpdateNodeData,
                  onDeleteNode: handleDeleteNode,
                  onAddNodeAfter: handleAddNodeAfter,
                  onGenerateSubRoadmap: handleGenerateSubRoadmap,
                  onManualToggleExpansion: handleManualToggleExpansion,
                  onUpdateNodeColor: handleUpdateNodeColor,
                  isDone: node.data.isDone || false,
                },
              }));
  
              setNodes(nodesWithHandlers);
              setEdges(projectData.edges || []);
              setPromptText(projectData.prompt || '');
              setProjectTitle(projectData.projectTitle || projectData.prompt || '');
  
              const maxNodeId = (projectData.nodes || []).reduce((max: number, node: any) => {
                const idParts = node.id.split('_');
                const numberPart = parseInt(idParts[idParts.length - 1]);
                return isNaN(numberPart) ? max : Math.max(max, numberPart);
              }, 0);
              setNodeIdCounter(maxNodeId + 1);
              setProjectLoaded(true);
              toast({ title: 'Project Loaded' });
            } else {
              console.log('Project not found or not accessible');
              toast({
                title: 'Project Not Found',
                description: `Project with ID ${currentProjectId} not found or you don't have access.`,
                variant: 'destructive',
              });
              router.push('/canvas');
            }
          })
          .catch(error => {
            console.error('Error loading project:', error);
            toast({
              title: 'Error Loading Project',
              description: 'Failed to load project. Please try again.',
              variant: 'destructive',
            });
            router.push('/canvas');
          })
          .finally(() => {
            console.log('Loading finally block - setting isLoading to false');
            setIsLoading(false);
          });
      } else if (!user) {
        console.log('User not logged in, cannot load project');
        toast({
          title: 'Authentication Required',
          description: 'Please log in to access this project.',
          variant: 'destructive',
        });
        router.push('/auth');
      }
    }
    // Case 2: New project creation or generation from prompt if no currentProjectId or currentProjectId is 'new' AND no project is loaded yet
    else if ((!currentProjectId || currentProjectId === 'new') && !projectLoaded && !generationAttempted.current) {
 console.log('Case 2: New project or generation from prompt');
      const storedPrompt = sessionStorage.getItem('roadmapPrompt');
      const initialPromptFromQuery = searchParams.get('prompt');

      if (storedPrompt) {
        setPromptText(storedPrompt);
        setProjectTitle(storedPrompt); // Set project title from stored prompt
        doGenerateRoadmap(storedPrompt);
 console.log('Generating roadmap from stored prompt');
        sessionStorage.removeItem('roadmapPrompt'); // Clean up sessionStorage
        generationAttempted.current = true;
      } else if (initialPromptFromQuery && (projectIdFromUrl === 'new' || !projectIdFromUrl)) { // Use projectIdFromUrl here for the initial check
        setPromptText(initialPromptFromQuery);
        setProjectTitle(initialPromptFromQuery); // Set project title from query prompt
        doGenerateRoadmap(initialPromptFromQuery);
 console.log('Generating roadmap from query prompt');
        generationAttempted.current = true;
      } else if (!initialPromptFromQuery && !storedPrompt && (projectIdFromUrl === 'new' || !projectIdFromUrl)) { // Use projectIdFromUrl here
        // If it's a new project with no prompt, maybe initialize an empty canvas?
        // For now, let's do nothing and wait for user input or remove the 'new' projectId
        // or redirect if this state shouldn't be reachable.
        console.log("New project requested with no prompt.");
        setProjectLoaded(true); // Consider it loaded as an empty project
      } else if (!initialPromptFromQuery && !storedPrompt && !projectIdFromUrl) { // Use projectIdFromUrl here
        // No project ID, no stored prompt, no query prompt - just an empty canvas
 console.log('Starting with an empty canvas');
        console.log("Starting with an empty canvas.");
        setProjectLoaded(true); // Consider it loaded as an empty project
      }
    }
  }, [currentProjectId, user, userLoading, projectLoaded, router, toast, setNodes, setEdges, setPromptText, setProjectTitle, setNodeIdCounter, doGenerateRoadmap, searchParams, handleToggleNodeDone, handleUpdateNodeData, handleDeleteNode, handleAddNodeAfter, handleGenerateSubRoadmap, handleManualToggleExpansion, handleUpdateNodeColor, projectIdFromUrl]); // Add currentProjectId and projectIdFromUrl to deps


  {/* Node Interaction Handlers */} // Note: Some of these handlers are now managed within useNodeManagement. Review this section.
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

  {/* Project Saving */}
  // Function to save the project to the database
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
      // Use the utility function to convert nodes to the Firestore format
      const storableNodes = toStorableNodes(nodes);

      // Calculate total and completed nodes
      const totalNodes = nodes.length;
      const completedNodes = nodes.filter(node => node.data.isDone).length;

      const projectToSave = {
        nodes: storableNodes,
        edges: edges,
        prompt: promptText,
        projectTitle: projectTitle, // Save the separate project title
        totalNodes: totalNodes, // Save total nodes
        completedNodes: completedNodes, // Save completed nodes
      };

      // Use currentProjectId for saving
      const savedProjectId = await saveProjectToDb(user.uid, currentProjectId || null, projectToSave);

      toast({
        title: 'Project Saved',
        description: 'Your roadmap has been saved.',
      });

      // If it was a new project (based on the state before saving), update currentProjectId and navigate
      if ((!currentProjectId || currentProjectId === 'new') && savedProjectId) {
        setCurrentProjectId(savedProjectId); // Update state with the new ID
        router.replace(`/canvas?projectId=${savedProjectId}`);
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
  }, [user, currentProjectId, nodes, edges, promptText, projectTitle, toast, router]); // Added currentProjectId to deps and removed projectId
  // Dependencies from useNodeManagement handlers

  //r
  return (
    <SidebarProvider>
      
      <RoadmapSidebar
        nodes={nodes}
        isLoading={isLoading}
        selectedNodeIdFromSidebar={selectedNodeIdFromSidebar}
        onNodeSelect={handleNodeSelectFromSidebar}
      />
      {/* Main Canvas Area */}

      <SidebarInset className="flex flex-col h-screen">
        <ProjectHeader
          projectTitle={projectTitle} // Use projectTitle state for display
          nodes={nodes}
          projectId={currentProjectId || 'new'} // Pass currentProjectId to header
          onExpandAll={handleExpandAllNodes}
          onCollapseAll={handleCollapseAllNodes}
          isMiniMapVisible={isMiniMapVisible}
          onToggleMiniMap={() => setIsMiniMapVisible(!isMiniMapVisible)}
          onProjectTitleChange={setProjectTitle} // Update projectTitle state on change
          onSaveRoadmap={handleSaveRoadmap} // Pass save function
          isLoading={isLoading}
          isUserLoggedIn={!!user}
        />
        {/* Roadmap Canvas Component */}

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

// Wrapper component with ReactFlowProvider and Suspense
export default function ProjectPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ReactFlowProvider>
        <FlowCanvas />
      </ReactFlowProvider>
    </Suspense>
  );
}

