"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type ReactFlowInstance,
  MarkerType,
} from 'reactflow';
import { type WordNodeData } from '@/app/canvas/components/word-node';
import { useToast } from '@/hooks/use-toast';
// Removed direct import of server-side Genkit function
// import { generateSubRoadmap, type GenerateSubRoadmapInput } from '@/app/api/generate-roadmap-flow';

// Define the input and output types for the API call
interface GenerateRoadmapInput {
  prompt: string;
}

interface RoadmapStep {
  id: string;
  title: string;
  description: string;
}

interface GenerateRoadmapOutput {
  roadmap: RoadmapStep[];
}

const DEFAULT_NODE_COLOR = '#A0A0A0';

interface UseNodeManagementProps {
  initialNodes?: Node<WordNodeData>[];
  initialEdges?: Edge[];
  isLoading: boolean; 
  reactFlowInstance: ReactFlowInstance | null;
  globalExpansionOverride: boolean | null;
  projectPrompt: string; 
}

export function useNodeManagement({
  initialNodes = [],
  initialEdges = [],
  isLoading,
  reactFlowInstance,
  globalExpansionOverride,
  projectPrompt,
}: UseNodeManagementProps) {
  const [nodes, setNodes] = useState<Node<WordNodeData>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(0);
  const { toast } = useToast();

  const nodesRef = useRef(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const edgesRef = useRef(edges);
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const projectPromptRef = useRef(projectPrompt);
  useEffect(() => {
    projectPromptRef.current = projectPrompt;
  }, [projectPrompt]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const handleUpdateNodeColor = useCallback((nodeId: string, newColor: string) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, color: newColor } } : node
      )
    );
  }, [setNodes]);

  const handleDeleteNode = useCallback((nodeIdToDelete: string) => {
    if (isLoading) return;
    const nodeToDelete = nodesRef.current.find(n => n.id === nodeIdToDelete);
    setNodes(nds => nds.filter(node => node.id !== nodeIdToDelete));
    setEdges(eds => eds.filter(edge => edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete));
    toast({ title: `Step "${nodeToDelete?.data?.title || 'Unknown'}" deleted.` });
  }, [setNodes, setEdges, toast, isLoading]);

  const handleManualToggleExpansion = useCallback((nodeId: string, explicitlyExpanded?: boolean) => {
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
            } else if (!newIsDone && node.data.description) {
              newOverrideState = true;
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
        description: `Step "${updatedData.title}" has been updated.`
      });
    },
    [setNodes, toast]
  );

  // Define handleAddNodeAfter and handleGenerateSubRoadmapPrompt before using them in data objects
  const handleAddNodeAfter = useCallback((currentNodeId: string) => {
    if (isLoading) return;

    let localCounter = nodeIdCounter;
    let newInternalId = `manualnode_${localCounter++}`;
    
    while (nodesRef.current.some(n => n.id === newInternalId) || edgesRef.current.some(e => e.source === newInternalId || e.target === newInternalId)) {
      newInternalId = `manualnode_${localCounter++}_${Math.random().toString(36).substring(2, 7)}`; 
    }
    setNodeIdCounter(localCounter);

    const currentNodes = nodesRef.current; 
    const currentNode = currentNodes.find(n => n.id === currentNodeId);

    if (!currentNode) {
      toast({ title: "Error", description: "Could not find the current node to add after.", variant: "destructive" });
      return;
    }

    const newNodePosition = {
      x: currentNode.position.x,
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
        onAddNodeAfter: handleAddNodeAfter, // Self-reference is fine here
        onGenerateSubRoadmap: handleGenerateSubRoadmapPrompt, // Referencing the other useCallback function
        onManualToggleExpansion: handleManualToggleExpansion,
        onUpdateNodeColor: handleUpdateNodeColor,
        color: DEFAULT_NODE_COLOR,
        _isExpandedOverride: globalExpansionOverride !== null ? globalExpansionOverride : true,
        depth: currentNode.data.depth, 
        parentId: currentNode.data.parentId
      },
      draggable: true,
      selectable: true,
    };

    setNodes(nds => {
        const cNodes = [...nds];
        const cNodeIndex = cNodes.findIndex(n => n.id === currentNodeId);
        if (cNodeIndex !== -1) {
             cNodes.splice(cNodeIndex + 1, 0, newNode);
        } else {
             cNodes.push(newNode);
        }
        return cNodes.map(n => n.id === newNode.id ? { ...n, selected: true } : { ...n, selected: false });
    });

    setEdges(eds => {
        const newEds = [...eds];
        const outgoingEdgeIndex = newEds.findIndex(edge => edge.source === currentNodeId);
        
        if (outgoingEdgeIndex !== -1) {
            const originalSuccessorId = newEds[outgoingEdgeIndex].target;
            newEds.splice(outgoingEdgeIndex, 1);
            newEds.push({
                id: `e-${newNode.id}-${originalSuccessorId}`,
                source: newNode.id,
                target: originalSuccessorId,
                animated: true,
                markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: 'hsl(var(--accent))' },
                style: { strokeWidth: 2, stroke: 'hsl(var(--accent))' },
                type: 'smoothstep', // Use smoothstep
            });
        }
        newEds.push({
            id: `e-${currentNodeId}-${newNode.id}`,
            source: currentNodeId,
            target: newNode.id,
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: 'hsl(var(--accent))' },
            style: { strokeWidth: 2, stroke: 'hsl(var(--accent))' },
             type: 'smoothstep', // Use smoothstep
        });
        return newEds;
    });

    toast({ title: "New step added!" });
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ nodes: [{ id: newNode.id }], duration: 300, padding: 0.3 });
      }
    }, 100);

  }, [
    isLoading, nodeIdCounter, 
    handleToggleNodeDone, handleUpdateNodeData, handleDeleteNode,
    handleManualToggleExpansion, handleUpdateNodeColor, 
    globalExpansionOverride, setNodes, setEdges, toast, reactFlowInstance, setNodeIdCounter, // Removed handleGenerateSubRoadmapPrompt
  ]);

  const handleGenerateSubRoadmapPrompt = useCallback(async (nodeId: string) => {
    const parentNode = nodesRef.current.find(n => n.id === nodeId);

    if (!parentNode) {
      toast({ title: "Error", description: "Could not find the parent node for sub-roadmap.", variant: "destructive" });
      return;
    }
    
    if (!projectPromptRef.current) {
      toast({ title: "Error", description: "Project prompt is not available to generate sub-roadmap.", variant: "destructive" });
      return;
    }

    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, isLoadingSubRoadmap: true } } : n));
    
    // The API route for sub-roadmap generation expects the same input structure
    // as the original generateRoadmapInput, but we will pass the parent node
    // details and project prompt to the API to handle the sub-roadmap logic server-side.
    // NOTE: The previous implementation was designed to call a *different* Genkit flow
    // `generateSubRoadmap`. The new API route `/api/generate-roadmap` is designed
    // to call `generateRoadmap`. We need to adjust the logic here or create a separate
    // API route for sub-roadmaps.

    // *** Assuming we need a separate API route for sub-roadmaps, or update the existing one ***
    // For now, let's assume the API route /api/generate-roadmap is updated to handle
    // both initial roadmap generation and sub-roadmap generation based on input structure.
    // A better approach would be a dedicated /api/generate-sub-roadmap route.

    // Let's proceed assuming /api/generate-roadmap can handle sub-roadmap requests
    // by looking at the input structure, or it has been updated to take parent details.
    // If not, a new API route is needed.

    // *** IMPORTANT ***: The current API route `src/app/api/generate-roadmap/route.ts`
    // only calls `generateRoadmap` with a simple `{ prompt: string }` input.
    // It *cannot* handle the complex `GenerateSubRoadmapInput` needed for sub-roadmaps.
    // We need to create a *new* API route specifically for generating sub-roadmaps.

    // Plan: Create a new API route `src/app/api/generate-sub-roadmap/route.ts`
    // This new route will import and call the `generateSubRoadmap` Genkit function.
    // Then, update this hook to call the new `/api/generate-sub-roadmap` endpoint.

    // *** Action: Create the new API route file and update this hook. ***

    // Let's proceed with creating the new API route for sub-roadmaps first.

    // The code below is commented out because it would call the wrong API route.
    /*
    const subRoadmapInput: GenerateSubRoadmapInput = {
      projectPrompt: projectPromptRef.current,
      parentStepId: parentNode.id,
      parentStepTitle: parentNode.data.title,
      parentStepDescription: parentNode.data.description || '',
      // mainRoadmapContext is not directly used by the /api/generate-roadmap route as currently implemented
      // mainRoadmapContext: mainRoadmapContextString || undefined,
    };

    console.log("Calling API route /api/generate-roadmap with input:", subRoadmapInput);

    try {
      const response = await fetch('/api/generate-roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subRoadmapInput),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const result: GenerateRoadmapOutput = await response.json(); // Assuming the API returns the same structure

      console.log("Sub-roadmap generated for node:", nodeId, "Result:", result);

      if (result && result.roadmap && result.roadmap.length > 0) { // Assuming the API returns 'roadmap' key
        toast({
          title: "Sub-Roadmap Generated",
          description: `Generated ${result.roadmap.length} sub-steps for "${parentNode.data.title}".`,
        });
        // TODO: Add new sub-nodes and edges to the graph based on result.roadmap
        // This part needs to be implemented based on the returned sub-steps.

      } else {
        toast({
          title: "No Sub-steps Generated",
          description: "The AI did not return any sub-steps or the result was empty.",
          variant: "default",
        });
      }

    } catch (error) {
      console.error("Sub-roadmap generation error:", error);
      let errorMessage = "Failed to generate sub-roadmap. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Error Generating Sub-Roadmap",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, isLoadingSubRoadmap: false } } : n));
    }
    */

    // *** Implementing the creation of the new API route for sub-roadmaps ***

    // Re-defining the input type needed for the *sub-roadmap* Genkit function
    interface GenerateSubRoadmapInput {
      projectPrompt: string;
      parentStepId: string;
      parentStepTitle: string;
      parentStepDescription: string;
      mainRoadmapContext?: string;
    }

    // Re-defining the output type for the *sub-roadmap* Genkit function
    interface GenerateSubRoadmapOutput {
      subRoadmap: RoadmapStep[]; // Note: This returns 'subRoadmap', not 'roadmap'
    }

    const subRoadmapInputForApi: GenerateSubRoadmapInput = {
      projectPrompt: projectPromptRef.current,
      parentStepId: parentNode.id,
      parentStepTitle: parentNode.data.title,
      parentStepDescription: parentNode.data.description || '',
      // Construct the main roadmap context string
      mainRoadmapContext: nodesRef.current
        .filter(n => !n.data.parentId && n.id !== nodeId) // Exclude sub-steps and the current parent node itself
        .map((n, index) => 
          `Step ${index + 1}: ${n.data.title}${n.data.description ? ' - ' + n.data.description : ''}`
        )
        .join('') || undefined,};

    console.log("Calling API route /api/generate-sub-roadmap with input:", subRoadmapInputForApi);

    try {
      // Calling the new API route for sub-roadmap generation
      const response = await fetch('/api/generate-sub-roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subRoadmapInputForApi),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const result: GenerateSubRoadmapOutput = await response.json();

      console.log("Sub-roadmap generated for node:", nodeId, "Result:", result);

      if (result && result.subRoadmap && result.subRoadmap.length > 0) {
        toast({
          title: "Sub-Roadmap Generated",
          description: `Generated ${result.subRoadmap.length} sub-steps for "${parentNode.data.title}".`,
        });
        
        // TODO: Add new sub-nodes and edges to the graph based on result.subRoadmap
        // This part needs to create node objects for each step in result.subRoadmap
        // and add them to the 'nodes' state, and create edges connecting them to the parent node.
        
        const newNodes: Node<WordNodeData>[] = result.subRoadmap.map((subStep, index) => {
            let localCounter = nodeIdCounter; // Use the hook's state for consistent ID generation
            let newInternalId = `subnode_${parentNode.id}_${index}_${localCounter++}`;
            setNodeIdCounter(localCounter); // Update counter

             while (nodesRef.current.some(n => n.id === newInternalId) || edgesRef.current.some(e => e.source === newInternalId || e.target === newInternalId)) {
                newInternalId = `subnode_${parentNode.id}_${index}_${localCounter++}_${Math.random().toString(36).substring(2, 7)}`; 
                setNodeIdCounter(localCounter); 
            }

          return {
            id: newInternalId,
            type: 'wordNode',
            position: { // Position these nodes relative to the parent
                x: parentNode.position.x + (index * 250) - (result.subRoadmap.length - 1) * 125, // Example positioning: spread out horizontally below parent
                y: parentNode.position.y + (parentNode.height || 150) + 100,
            },
            data: {
              title: subStep.title,
              description: subStep.description,
              isDone: false,
              onToggleDone: handleToggleNodeDone,
              onUpdateNodeData: handleUpdateNodeData,
              onDeleteNode: handleDeleteNode,
              onAddNodeAfter: handleAddNodeAfter, // Referencing the other useCallback function
              onGenerateSubRoadmap: handleGenerateSubRoadmapPrompt, // Self-reference is fine here
              onManualToggleExpansion: handleManualToggleExpansion,
              onUpdateNodeColor: handleUpdateNodeColor,
              color: DEFAULT_NODE_COLOR,
              _isExpandedOverride: globalExpansionOverride !== null ? globalExpansionOverride : false, // Sub-steps start collapsed
              depth: (parentNode.data.depth || 0) + 1, // Increase depth
              parentId: parentNode.id, // Link to parent
            },
            draggable: true,
            selectable: true,
          };
        });

        const newEdges: Edge[] = newNodes.map(newNode => ({
          id: `e-${parentNode.id}-${newNode.id}`,
          source: parentNode.id,
          target: newNode.id,
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: 'hsl(var(--accent))' },
          style: { strokeWidth: 2, stroke: 'hsl(var(--accent))' },
          type: 'smoothstep', // Use smoothstep for cleaner layout
        }));

        setNodes(nds => [...nds, ...newNodes]);
        setEdges(eds => [...eds, ...newEdges]);

        // Optionally fit view to new nodes
         setTimeout(() => {
           if (reactFlowInstance) {
             reactFlowInstance.fitView({
                nodes: [parentNode, ...newNodes], 
                duration: 300, 
                padding: 0.3
            });
           }
         }, 100);

      } else {
        toast({
          title: "No Sub-steps Generated",
          description: "The AI did not return any sub-steps or the result was empty.",
          variant: "default",
        });
      }

    } catch (error) {
      console.error("Sub-roadmap generation error:", error);
      let errorMessage = "Failed to generate sub-roadmap. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Error Generating Sub-Roadmap",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, isLoadingSubRoadmap: false } } : n));
    }


  }, [setNodes, toast, nodesRef, projectPromptRef, globalExpansionOverride, reactFlowInstance, nodeIdCounter, setNodeIdCounter, handleToggleNodeDone, handleUpdateNodeData, handleDeleteNode, handleManualToggleExpansion, handleUpdateNodeColor, setEdges /* Removed handleAddNodeAfter */ ]);

  const handleDeleteSelectedNodes = useCallback(() => {
    if (isLoading) return;
    const selectedNodeIds = nodesRef.current.filter(n => n.selected).map(n => n.id);
    if (selectedNodeIds.length === 0) return;

    setNodes(nds => nds.filter(node => !node.selected));
    setEdges(eds => eds.filter(edge => !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)));
    toast({ title: `${selectedNodeIds.length} step(s) deleted.` });
  }, [isLoading, setNodes, setEdges, toast]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isLoading) return;
      if (event.key === 'Delete' || (event.key === 'x' && (event.ctrlKey || event.metaKey))) {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          if (event.key === 'Delete' && !(event.ctrlKey || event.metaKey)) return; 
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

  useEffect(() => {
    if (globalExpansionOverride !== null) {
      setNodes(nds => nds.map(n => {
        if (n.data.isLoading) return n; 
        if (n.data.isLoadingSubRoadmap) return n; 
        if (!n.data.description) return { ...n, data: { ...n.data, _isExpandedOverride: false } };
        return { ...n, data: { ...n.data, _isExpandedOverride: globalExpansionOverride } };
      }));
    }
  }, [globalExpansionOverride, setNodes]);

  return {
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
  };
}
