'use server';

import { prisma } from '@/lib/prisma';
import type { Edge } from 'reactflow';
import type { ProjectPreview, ProjectRecord, StorableNode } from '@/lib/project-utils';

async function assertProjectAccess(projectId: string, userId: string | null) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { shares: true },
  });
  if (!project) return null;

  const hasAccess =
    project.isPublic ||
    (!!userId && (project.ownerId === userId || project.shares.some(s => s.userId === userId)));

  return hasAccess ? project : null;
}

function toProjectRecord(project: {
  id: string;
  ownerId: string;
  isPublic: boolean;
  projectTitle: string;
  prompt: string;
  nodes: unknown;
  edges: unknown;
  createdAt: Date;
  updatedAt: Date;
}): ProjectRecord {
  return {
    id: project.id,
    ownerId: project.ownerId,
    isPublic: project.isPublic,
    projectTitle: project.projectTitle,
    prompt: project.prompt,
    nodes: (project.nodes as StorableNode[]) || [],
    edges: (project.edges as Edge[]) || [],
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export async function saveProjectToDb(
  userId: string,
  projectId: string | null,
  projectData: {
    nodes: StorableNode[];
    edges: Edge[];
    prompt: string;
    projectTitle: string;
    totalNodes: number;
    completedNodes: number;
  }
): Promise<string> {
  if (!userId) throw new Error('User ID is required to save project.');

  if (projectId) {
    const existing = await prisma.project.findUnique({ where: { id: projectId } });
    if (existing && existing.ownerId !== userId) {
      throw new Error('User does not have permission to update this project.');
    }
    await prisma.project.update({
      where: { id: projectId },
      data: {
        projectTitle: projectData.projectTitle,
        prompt: projectData.prompt,
        nodes: projectData.nodes as object,
        edges: projectData.edges as object,
        totalNodes: projectData.totalNodes,
        completedNodes: projectData.completedNodes,
      },
    });
    return projectId;
  }

  const created = await prisma.project.create({
    data: {
      ownerId: userId,
      projectTitle: projectData.projectTitle,
      prompt: projectData.prompt,
      nodes: projectData.nodes as object,
      edges: projectData.edges as object,
      totalNodes: projectData.totalNodes,
      completedNodes: projectData.completedNodes,
      isPublic: false,
    },
  });
  return created.id;
}

export async function getProjectFromDb(currentUserId: string | null, projectId: string): Promise<ProjectRecord | null> {
  if (!projectId) return null;
  const project = await assertProjectAccess(projectId, currentUserId);
  if (!project) return null;
  return toProjectRecord(project);
}

export async function getUserProjectsFromDb(userId: string): Promise<ProjectPreview[]> {
  if (!userId) return [];

  const projects = await prisma.project.findMany({
    where: {
      OR: [{ ownerId: userId }, { shares: { some: { userId } } }],
    },
    orderBy: { updatedAt: 'desc' },
  });

  return projects.map(project => ({
    id: project.id,
    projectTitle: project.projectTitle,
    updatedAt: project.updatedAt,
    createdAt: project.createdAt,
    ownerId: project.ownerId,
    isPublic: project.isPublic,
    nodeCount: Array.isArray(project.nodes) ? project.nodes.length : 0,
    totalNodes: project.totalNodes,
    completedNodes: project.completedNodes,
  }));
}

export async function deleteProjectFromDb(userId: string, projectId: string): Promise<void> {
  if (!userId || !projectId) throw new Error('User ID and Project ID are required to delete project.');

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    console.warn('Project not found for deletion.');
    return;
  }
  if (project.ownerId !== userId) {
    throw new Error('User does not have permission to delete this project.');
  }
  await prisma.project.delete({ where: { id: projectId } });
}

export async function shareProjectWithUser(ownerId: string, projectId: string, targetUserId: string): Promise<void> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error('Project does not exist.');
  if (project.ownerId !== ownerId) throw new Error('Only the owner can share the project.');
  if (ownerId === targetUserId) throw new Error('Cannot share with yourself.');

  const targetUser = await prisma.user.findFirst({
    where: { OR: [{ id: targetUserId }, { email: targetUserId }] },
  });
  if (!targetUser) throw new Error('No user found with that ID or email.');

  await prisma.projectShare.upsert({
    where: { projectId_userId: { projectId, userId: targetUser.id } },
    create: { projectId, userId: targetUser.id },
    update: {},
  });
}

export async function unshareProjectWithUser(ownerId: string, projectId: string, targetUserId: string): Promise<void> {
  if (!ownerId || !projectId || !targetUserId) {
    throw new Error('Owner ID, Project ID, and Target User ID are required to unshare project.');
  }
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== ownerId) {
    throw new Error('Project not found or user is not the owner.');
  }
  if (ownerId === targetUserId) {
    throw new Error('Cannot unshare the project owner.');
  }

  await prisma.projectShare.deleteMany({ where: { projectId, userId: targetUserId } });
}

export async function setProjectPublicStatus(ownerId: string, projectId: string, isPublic: boolean): Promise<void> {
  if (!ownerId || !projectId) {
    throw new Error('Owner ID and Project ID are required to set public status.');
  }
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== ownerId) {
    throw new Error('Project not found or user is not the owner.');
  }
  await prisma.project.update({ where: { id: projectId }, data: { isPublic } });
}

export async function updateProjectTitleInDb(userId: string, projectId: string, newTitle: string): Promise<void> {
  if (!userId || !projectId || typeof newTitle !== 'string' || newTitle.trim() === '') {
    throw new Error('User ID, Project ID, and a non-empty new title are required to update the project title.');
  }

  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { shares: true } });
  if (!project) {
    throw new Error('Project not found.');
  }
  const hasPermission = project.ownerId === userId || project.shares.some(s => s.userId === userId);
  if (!hasPermission) {
    throw new Error("User does not have permission to update this project's title.");
  }

  await prisma.project.update({ where: { id: projectId }, data: { projectTitle: newTitle } });
}
