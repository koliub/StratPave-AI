import type { Node, Edge } from 'reactflow';
import type { WordNodeData } from '@/app/canvas/components/word-node';

export interface StorableNodeData extends Omit<WordNodeData,
  'onToggleDone' |
  'onUpdateNodeData' |
  'onDeleteNode' |
  'onAddNodeAfter' |
  'onManualToggleExpansion' |
  'onUpdateNodeColor' |
  'onGenerateSubRoadmap' |
  'subRoadmapNodes' |
  'subRoadmapEdges'
> {}

export interface StorableNode extends Omit<Node<StorableNodeData>, 'data'> {
  data: StorableNodeData;
}

export const toStorableNodeData = (nodeData: WordNodeData): StorableNodeData => {
  const {
    onToggleDone,
    onUpdateNodeData,
    onDeleteNode,
    onAddNodeAfter,
    onManualToggleExpansion,
    onUpdateNodeColor,
    onGenerateSubRoadmap,
    ...restOfData
  } = nodeData;

  return {
    ...restOfData,
  };
};

export const toStorableNodes = (nodes: Node<WordNodeData>[]): StorableNode[] => {
  return nodes.map(node => ({
    ...node,
    data: toStorableNodeData(node.data),
  }));
};

export interface ProjectPreview {
  id: string;
  projectTitle: string;
  updatedAt: Date;
  createdAt: Date;
  ownerId: string;
  isPublic: boolean;
  nodeCount: number;
  totalNodes: number;
  completedNodes: number;
}

export interface ProjectRecord {
  id: string;
  ownerId: string;
  isPublic: boolean;
  projectTitle: string;
  prompt: string;
  nodes: StorableNode[];
  edges: Edge[];
  createdAt: Date;
  updatedAt: Date;
}
