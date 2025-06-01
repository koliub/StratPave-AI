"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type ReactFlowInstance,
 MarkerType,
 type XYPosition,
} from "reactflow";
import { v4 as uuidv4 } from 'uuid'; // Import uuid for unique IDs
import { generateSubRoadmap } from "@/ai/RoadmapNodeGen"; // Import the AI function
import { type WordNodeData } from "@/app/canvas/components/word-node";
import { useToast } from "@/hooks/use-toast";

interface UseNodeManagementProps {
  initialNodes?: Node<WordNodeData>[];
  initialEdges?: Edge[];
  isLoading: boolean;
  reactFlowInstance: ReactFlowInstance | null;
  globalExpansionOverride: boolean | null;
  projectPrompt: string;
}

const DEFAULT_NODE_COLOR = "#A0A0A0";
const SUB_NODE_COLOR = "#FACC15";

export function useNodeManagement({
  initialNodes = [],
  initialEdges = [],
  isLoading,
  reactFlowInstance,
  globalExpansionOverride,
  projectPrompt,
}: UseNodeManagementProps) {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(0);
  const { toast } = useToast();

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const projectPromptRef = useRef(projectPrompt);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  useEffect(() => { projectPromptRef.current = projectPrompt; }, [projectPrompt]);

  const onNodesChange: OnNodesChange = useCallback(
    changes => setNodes(nds => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    changes => setEdges(eds => applyEdgeChanges(changes, eds)),
    []
  );

  const updateNode = (nodeId: string, updater: (node: Node<WordNodeData>) => Node<WordNodeData>) =>
    setNodes(prev => prev.map(n => (n.id === nodeId ? updater(n) : n)));

  const handleUpdateNodeColor = useCallback((id: string, color: string) =>
    updateNode(id, n => ({ ...n, data: { ...n.data, color } })), []);

  const handleManualToggleExpansion = useCallback((id: string, state?: boolean) =>
    updateNode(id, n => {
      const expanded = state ?? !(n.data._isExpandedOverride ?? !!n.data.description);
      return { ...n, data: { ...n.data, _isExpandedOverride: expanded } };
    }), []);

  const handleToggleNodeDone = useCallback((id: string) =>
    updateNode(id, n => {
      const newIsDone = !n.data?.isDone;
      const shouldExpand = globalExpansionOverride ?? (!newIsDone && !!n.data.description);
      return {
 // Use applyNodeChanges here to handle potential position updates by React Flow
 ...applyNodeChanges([{ id, type: 'position', position: n.position }], [n])[0],
        ...n,
        data: {
          ...n.data,
          isDone: newIsDone,
          _isExpandedOverride: shouldExpand,
        },
      };
    }), [globalExpansionOverride]);

  const handleUpdateNodeData = useCallback((id: string, data: { title: string; description?: string }) => {
    updateNode(id, n => ({ ...n, data: { ...n.data, ...data } }));
    toast({ title: "Step Updated", description: `Step "${data.title}" has been updated.` });
 setNodes(nds => [...nds]);
  }, []);

  const handleDeleteNode = useCallback((id: string) => {
    if (isLoading) return;
    const deleted = nodesRef.current.find(n => n.id === id);
    setNodes(nds => nds.filter(n => n.id !== id));
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
    toast({ title: `Step "${deleted?.data?.title || "Unknown"}" deleted.` });
  }, [isLoading]);

  const handleAddNodeAfter = useCallback((id: string) => {
    if (isLoading) return;
  
    let counter = nodeIdCounter;
    let newId = `manualnode_${counter++}`;
    const isIdTaken = (id: string) =>
      nodesRef.current.some(n => n.id === id) || edgesRef.current.some(e => [e.source, e.target].includes(id));
    while (isIdTaken(newId)) newId = `manualnode_${counter++}_${Math.random().toString(36).slice(2, 7)}`;
    setNodeIdCounter(counter);
  
    const currentNode = nodesRef.current.find(n => n.id === id);
    if (!currentNode) {
      toast({ title: "Error", description: "Current node not found.", variant: "destructive" });
      return;
    }
  
    const position = {
      x: currentNode.position.x,
      y: currentNode.position.y + (currentNode.height || 150) + 60,
    };
  
    const newNode: Node<WordNodeData> = {
      id: newId,
      type: "wordNode",
      position,
      draggable: true,
      selectable: true,
      data: {
        title: "New Step",
        description: "Double-click description to edit.",
        isDone: false,
        color: DEFAULT_NODE_COLOR,
        depth: currentNode.data.depth,
        parentId: currentNode.data.parentId,
        _isExpandedOverride: globalExpansionOverride ?? true,
        onToggleDone: handleToggleNodeDone,
        onUpdateNodeData: handleUpdateNodeData,
        onDeleteNode: handleDeleteNode,
        onAddNodeAfter: handleAddNodeAfter,
        onManualToggleExpansion: handleManualToggleExpansion,
        onUpdateNodeColor: handleUpdateNodeColor,
      },
    };
  
    setNodes(nds => {
      const index = nds.findIndex(n => n.id === id);
      const updated = [...nds];
      index !== -1 ? updated.splice(index + 1, 0, newNode) : updated.push(newNode);
      return updated.map(n => ({ ...n, selected: n.id === newId }));
    });
  
    setEdges(eds => {
      const updated = eds.filter(e => !(e.source === id && !e.target));
      const existing = eds.find(e => e.source === id);
      const edgeBase = {
        type: "smoothstep",
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: SUB_NODE_COLOR },
        style: { strokeWidth: 2, stroke: SUB_NODE_COLOR },
      };
      if (existing) updated.push({ ...edgeBase, id: `e-${newId}-${existing.target}`, source: newId, target: existing.target });
      updated.push({ ...edgeBase, id: `e-${id}-${newId}`, source: id, target: newId });
      return updated;
    });
  
    toast({ title: "New step added!" });
    setTimeout(() => reactFlowInstance?.fitView({ nodes: [{ id: newId }], duration: 300, padding: 0.3 }), 100);
  }, [
    isLoading, nodeIdCounter, handleToggleNodeDone, handleUpdateNodeData, handleDeleteNode,
    handleManualToggleExpansion, handleUpdateNodeColor, globalExpansionOverride, reactFlowInstance
  ]);
  const handleGenerateSubRoadmap = useCallback(async (nodeId: string) => {
    const parentNode = nodesRef.current.find(n => n.id === nodeId);
    if (!parentNode) {
      toast({ title: 'Node Not Found', description: 'Could not find the selected node.', variant: 'destructive' });
      return;
    }
  
    const parentIndex = nodesRef.current.findIndex(n => n.id === nodeId);
    const nextNode = nodesRef.current[parentIndex + 1];
  
    setNodes(nds => nds.map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, isLoadingSubRoadmap: true } } : n
    ));
  
    try {
      const input = {
        projectTitle: projectPromptRef.current || 'Untitled Project',
        parentNode: { title: parentNode.data.title, description: parentNode.data.description || '' },
        nextNode: nextNode ? { title: nextNode.data.title, description: nextNode.data.description || '' } : undefined,
      };
  
      const jsonResult = await generateSubRoadmap(input);
      if (!jsonResult) {
        toast({ title: 'No Sub-Roadmap Generated', description: 'AI returned no steps.' });
        return;
      }
  
      const { roadmap }: { roadmap: { id: string; title: string; description?: string; }[] } = JSON.parse(jsonResult);
  
      const parentPos = parentNode.position;
      const spacingY = 150;
      const baseY = parentPos.y + (parentNode.height || 100) + 50;
      const parentDepth = parentNode.data.depth || 0;
  
      const newSubNodes = roadmap.map((step, i) => ({
        id: `${nodeId}_sub_${uuidv4()}`,
        type: 'wordNode',
        position: { x: parentPos.x, y: baseY + i * spacingY },
        draggable: true,
        selectable: true,
        data: {
          ...step,
          isDone: false,
          isSubStep: true,
          color: SUB_NODE_COLOR,
          _isExpandedOverride: !!step.description,
          depth: parentDepth + 1,
          parentId: nodeId,
          onToggleDone: handleToggleNodeDone,
          onUpdateNodeData: handleUpdateNodeData,
          onDeleteNode: handleDeleteNode,
          onAddNodeAfter: handleAddNodeAfter,
          onGenerateSubRoadmap: handleGenerateSubRoadmap,
          onManualToggleExpansion: handleManualToggleExpansion,
          onUpdateNodeColor: handleUpdateNodeColor,
        },
      }));
  
      const edgeStyle = {
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: SUB_NODE_COLOR },
        style: { strokeWidth: 2, stroke: SUB_NODE_COLOR },
      };
  
      const newSubEdges: Edge[] = [];
      if (newSubNodes.length) {
        newSubEdges.push({ id: `e-${nodeId}-${newSubNodes[0].id}`, source: nodeId, target: newSubNodes[0].id, ...edgeStyle });
        for (let i = 0; i < newSubNodes.length - 1; i++) {
          newSubEdges.push({ id: `e-${newSubNodes[i].id}-${newSubNodes[i + 1].id}`, source: newSubNodes[i].id, target: newSubNodes[i + 1].id, ...edgeStyle });
        }
      }
  
      setNodes(nds => [...nds, ...newSubNodes]);
      setEdges(eds => [...eds, ...newSubEdges]);
  
      toast({
        title: 'Sub-Roadmap Generated!',
        description: `Added ${newSubNodes.length} steps under "${parentNode.data.title}".`,
      });
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: 'Error Generating Sub-Roadmap',
        description: err instanceof Error ? err.message : 'Unknown error.',
        variant: 'destructive',
      });
    } finally {
      setNodes(nds => nds.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, isLoadingSubRoadmap: false } } : n
      ));
    }
  }, [
    setNodes, setEdges, toast,
    handleToggleNodeDone, handleUpdateNodeData, handleDeleteNode,
    handleAddNodeAfter, handleManualToggleExpansion, handleUpdateNodeColor,
    nodesRef, projectPromptRef
  ]);
  
  const handleDeleteSelectedNodes = useCallback(() => {
    if (isLoading) return;
    const selectedIds = nodesRef.current.filter(n => n.selected).map(n => n.id);
    if (!selectedIds.length) return;
    setNodes(nds => nds.filter(n => !selectedIds.includes(n.id)));
    setEdges(eds => eds.filter(e => !selectedIds.includes(e.source) && !selectedIds.includes(e.target)));
    toast({ title: `${selectedIds.length} step(s) deleted.` });
  }, [isLoading]);

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      const isDelete = e.key === "Delete";
      const isCut = e.key === "x" && (e.ctrlKey || e.metaKey);
      const focusedTag = document.activeElement?.tagName;
      const isTextInput = focusedTag === "INPUT" || focusedTag === "TEXTAREA";

      if (isLoading || (isDelete && isTextInput && !(e.ctrlKey || e.metaKey))) return;
      if (isCut) e.preventDefault();
      if (isDelete || isCut) handleDeleteSelectedNodes();
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [handleDeleteSelectedNodes, isLoading]);

  useEffect(() => {
    if (globalExpansionOverride !== null) {
      setNodes(nds =>
        nds.map(n => ({
          ...n,
          data: {
            ...n.data,
            _isExpandedOverride: n.data.description ? globalExpansionOverride : false,
          },
        }))
      );
    }
  }, [globalExpansionOverride]);

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
 handleDeleteSelectedNodes, // Add this handler to the return
    handleManualToggleExpansion,
    handleToggleNodeDone,
    handleUpdateNodeData,
    handleAddNodeAfter,
    handleGenerateSubRoadmap, // Add this handler to the return
  };
}
