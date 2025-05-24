// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

import {
  getFirestore,
  type Firestore,
  collection,
  Timestamp,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import type { Node, Edge } from 'reactflow';
import type { WordNodeData } from '@/app/canvas/components/word-node';

// Your web app's Firebase configuration
// IMPORTANT: Replace these with your actual Firebase project credentials
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyBLSoTXZpLDYWTbO-p4bH8nihglOGIKNfM",
  authDomain: "word-node.firebaseapp.com",
  projectId: "word-node",
  storageBucket: "word-node.firebasestorage.app",
  messagingSenderId: "390437258668",
  appId: "1:390437258668:web:84f8fe666bc4d6e7806609"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // if already initialized, use that one
}

// Initialize the Gemini Developer API backend service


// Create a `GenerativeModel` instance with a model that supports your use case


const auth: Auth = getAuth(app);

// Initialize Firestore with persistence options directly
const db: Firestore = getFirestore(app);

// Firestore data types
export interface ProjectNodeDataForFirestore extends Omit<WordNodeData,
  'onToggleDone' |
  'onUpdateNodeData' |
  'onDeleteNode' |
  'onAddNodeAfter' |
  'onManualToggleExpansion' |
  'onUpdateNodeColor' |
  'onGenerateSubRoadmap' |
  'subRoadmapNodes' |
  'subRoadmapEdges'
> {
  // Add any specific Firestore-only fields if needed
}

export interface ProjectNodeForFirestore extends Omit<Node<ProjectNodeDataForFirestore>, 'data'> {
  data: ProjectNodeDataForFirestore;
}

export interface Project {
  id?: string; // ID from Firestore, optional if new
  ownerId: string; // UID of the user who created the project
  sharedWithUserIds: string[]; // Array of UIDs of users with whom the project is shared
  isPublic: boolean; // Whether the project is publicly viewable
  projectTitle: string;
  prompt: string;
  nodes: ProjectNodeForFirestore[];
  edges: Edge[];
  createdAt: any; // serverTimestamp() or FieldValue
  updatedAt: any; // serverTimestamp() or FieldValue
}

export interface ProjectPreview extends Pick<Project, 'id' | 'projectTitle' | 'updatedAt' | 'createdAt' | 'ownerId' | 'isPublic'  > {

  nodeCount: number;
  totalNodes: number;
  completedNodes: number;
}


// Utility to strip callbacks from WordNodeData for Firestore
export const toFirestoreNodeData = (nodeData: WordNodeData): ProjectNodeDataForFirestore => {
  const {
    onToggleDone,
    onUpdateNodeData,
    onDeleteNode,
    onAddNodeAfter,
    onManualToggleExpansion,
    onUpdateNodeColor,
    onGenerateSubRoadmap,
    subRoadmapNodes,
    subRoadmapEdges,
    ...restOfData
  } = nodeData;

  return {
    ...restOfData,
  };
};

export const toFirestoreNodes = (nodes: Node<WordNodeData>[]): ProjectNodeForFirestore[] => {
  return nodes.map(node => ({
    ...node,
    data: toFirestoreNodeData(node.data),
  }));
};


// Firestore service functions
export const saveProjectToDb = async (userId: string, projectId: string | null, projectData: Omit<Project, 'id' | 'ownerId' | 'sharedWithUserIds' | 'isPublic' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  if (!userId) throw new Error("User ID is required to save project.");

  const projectCollectionRef = collection(db, `projects`);
  let docRef;

  if (projectId) {
    docRef = doc(projectCollectionRef, projectId);
    // Before updating, ensure the user has permission (is owner) - Security rules will also enforce this
    const existingProjectSnap = await getDoc(docRef);
    if (existingProjectSnap.exists() && existingProjectSnap.data().ownerId !== userId) {
      throw new Error("User does not have permission to update this project.");
    }
    await setDoc(docRef, { ...projectData, updatedAt: serverTimestamp() }, { merge: true });
    return projectId;
  } else {
    docRef = doc(projectCollectionRef); // Firestore generates new ID
    await setDoc(docRef, {
      ...projectData,
      ownerId: userId,
      sharedWithUserIds: [], // Initialize as empty
      isPublic: false, // Initialize as false
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    // Optional but recommended: Add projectId to the user's accessibleProjectIds array
    // This helps in efficiently fetching the list of all projects a user can see.
    // This write is separate and should be handled carefully if the main write fails.
    // A batched write could be used if both updates must succeed or fail together.
    try {
        const userDocRef = doc(db, `users/${userId}`);
        await updateDoc(userDocRef, {
            accessibleProjectIds: arrayUnion(docRef.id)
        });
    } catch (error) {
        console.error("Failed to add project ID to user's accessible list:", error);
        // Consider if you need to roll back the project creation or handle this discrepancy
    }
    return docRef.id;
  }
};

export const getProjectFromDb = async (currentUserId: string | null, projectId: string): Promise<Project | null> => {
  if (!projectId) return null;
  const projectDocRef = doc(db, `projects/${projectId}`);
  const projectSnap = await getDoc(projectDocRef);

  if (projectSnap.exists()) {
    const projectData = { id: projectSnap.id, ...projectSnap.data() } as Project;
    // Access control check (redundant with security rules, but good for immediate feedback)
    if (projectData.isPublic || (currentUserId && (projectData.ownerId === currentUserId || projectData.sharedWithUserIds.includes(currentUserId)))) {
      return projectData;
    } else {
      console.warn("User does not have permission to access this project or project is not public.");
      return null; // Or throw an error
    }
  } else {
    console.log("No such project!");
    return null;
  }
};

export const getUserProjectsFromDb = async (userId: string): Promise<ProjectPreview[]> => {
  if (!userId) return [];
  const projectsCollectionRef = collection(db, `projects`);

  // Fetch projects where the user is the owner OR is in sharedWithUserIds
  // Note: Firestore does not support OR queries across different fields (ownerId || sharedWithUserIds)
  // We execute two separate queries and merge the results.
  const ownedQuery = query(projectsCollectionRef, where("ownerId", "==", userId));
  const sharedQuery = query(projectsCollectionRef, where("sharedWithUserIds", "array-contains", userId));

  const [ownedSnapshot, sharedSnapshot] = await Promise.all([
    getDocs(ownedQuery),
    getDocs(sharedQuery)
  ]);

  const projectsMap = new Map<string, ProjectPreview>();

  ownedSnapshot.forEach((doc) => {
    const data = doc.data();
    projectsMap.set(doc.id, {
      id: doc.id,
      projectTitle: data.projectTitle, // Corrected mapping
      updatedAt: data.updatedAt,
      createdAt: data.createdAt,
      ownerId: data.ownerId,
      isPublic: data.isPublic,
      nodeCount: data.nodes?.length || 0,
      totalNodes: data.totalNodes,
      completedNodes: data.completedNodes,

    });
  });

  sharedSnapshot.forEach((doc) => {
    if (!projectsMap.has(doc.id)) { // Avoid duplicates if user is owner and also in sharedWith
      const data = doc.data();
      projectsMap.set(doc.id, {
        id: doc.id,
        projectTitle: data.projectTitle, // Corrected mapping
        updatedAt: data.updatedAt,
        createdAt: data.createdAt,
        ownerId: data.ownerId,
        isPublic: data.isPublic,
        nodeCount: data.nodes?.length || 0,
        totalNodes: data.totalNodes,
      completedNodes: data.completedNodes,
      });
    }
  });

  // Sort projects by updatedAt descending
  return Array.from(projectsMap.values()).sort((a, b) => {
    const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
    const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
    return timeB - timeA;
  });
};

export const deleteProjectFromDb = async (userId: string, projectId: string): Promise<void> => {
  if (!userId || !projectId) throw new Error("User ID and Project ID are required to delete project.");

  const projectDocRef = doc(db, `projects/${projectId}`);
  const projectSnap = await getDoc(projectDocRef);

  if (projectSnap.exists()) {
    // Client-side check (Security rules will also enforce this)
    if (projectSnap.data().ownerId === userId) {
      await deleteDoc(projectDocRef);
      // Optional but recommended: Remove projectId from the user's accessibleProjectIds array
      try {
          const userDocRef = doc(db, `users/${userId}`);
          await updateDoc(userDocRef, {
              accessibleProjectIds: arrayRemove(projectId)
          });
      } catch (error) {
          console.error("Failed to remove project ID from user's accessible list:", error);
          // Consider handling this discrepancy
      }

    } else {
      throw new Error("User does not have permission to delete this project.");
    }
  } else {
    console.warn("Project not found for deletion.");
  }
};

// --- Collaboration functions ---
export const shareProjectWithUser = async (ownerId: string, projectId: string, targetUserEmail: string): Promise<void> => {
  if (!ownerId || !projectId || !targetUserEmail) {
    throw new Error("Owner ID, Project ID, and Target User Email are required to share project.");
  }

  const projectDocRef = doc(db, `projects/${projectId}`);

  // Verify the owner is the one sharing (Security rules will also enforce this)
  const projectSnap = await getDoc(projectDocRef);
  if (!projectSnap.exists() || projectSnap.data().ownerId !== ownerId) {
     throw new Error("Only the project owner can share it.");
  }


  // 1. Find targetUser UID by email
  // This is crucial for security. You MUST find the user's UID based on the email.
  // Querying a 'users' collection where email is indexed is a standard way.
  // In a real application, you would likely have a Cloud Function handle this
  // server-side to prevent clients from querying arbitrary user emails directly.
  const usersRef = collection(db, 'users'); // Assuming you have a 'users' collection
  const q = query(usersRef, where("email", "==", targetUserEmail)); // Assuming 'email' field exists on user documents and is indexed
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    // User not found with that email
    throw new Error(`No user found with email: ${targetUserEmail}`);
  }

  // Get the UID of the target user (assuming email is unique and you get one result)
  const targetUserId = querySnapshot.docs[0].id;

  // Prevent sharing with self (optional, but good practice)
  if (targetUserId === ownerId) {
      throw new Error("Cannot share a project with yourself.");
  }


  // 2. Add the target user's UID to the 'sharedWithUserIds' array in the project document
  // Using arrayUnion prevents race conditions if multiple people try to add collaborators simultaneously.
  // Security rules will ensure only the owner can perform this update.
  await updateDoc(projectDocRef, {
    sharedWithUserIds: arrayUnion(targetUserId),
    updatedAt: serverTimestamp() // Update timestamp on share
  });

  // 3. Optional but Recommended: Add the projectId to the target user's document
  // This helps in efficiently fetching all projects a user has access to.
  // This write is separate and should be handled carefully if the main write fails.
  // A batched write could be used if both updates must succeed or fail together.
    try {
        const targetUserDocRef = doc(db, `users/${targetUserId}`);
         await updateDoc(targetUserDocRef, {
            accessibleProjectIds: arrayUnion(projectId)
        });
    } catch (error) {
         console.error("Failed to add project ID to target user's accessible list:", error);
         // Consider handling this discrepancy - the project is shared, but the user might not see it listed immediately
    }

  console.log(`Project ${projectId} shared with user ${targetUserId} (${targetUserEmail})`);
};

export const unshareProjectWithUser = async (ownerId: string, projectId: string, targetUserId: string): Promise<void> => {
  if (!ownerId || !projectId || !targetUserId) {
      throw new Error("Owner ID, Project ID, and Target User ID are required to unshare project.");
  }
  const projectDocRef = doc(db, `projects/${projectId}`);

  // Verify the owner is the one unsharing (Security rules will also enforce this)
  const projectSnap = await getDoc(projectDocRef);
  if (!projectSnap.exists() || projectSnap.data().ownerId !== ownerId) {
    throw new Error("Project not found or user is not the owner.");
  }
   if (ownerId === targetUserId) {
     throw new Error("Cannot unshare the project owner.");
   }

  // Remove the target user's UID from the 'sharedWithUserIds' array
  // Using arrayRemove prevents race conditions.
  // Security rules will ensure only the owner can perform this update.
  await updateDoc(projectDocRef, {
    sharedWithUserIds: arrayRemove(targetUserId),
    updatedAt: serverTimestamp() // Update timestamp on unshare
  });

   // Optional but Recommended: Remove the projectId from the target user's document
   // This helps in efficiently fetching the list of all projects a user can see.
   try {
        const targetUserDocRef = doc(db, `users/${targetUserId}`);
        await updateDoc(targetUserDocRef, {
            accessibleProjectIds: arrayRemove(projectId)
        });
    } catch (error) {
         console.error("Failed to remove project ID from target user's accessible list:", error);
         // Consider handling this discrepancy
    }

};

export const setProjectPublicStatus = async (ownerId: string, projectId: string, isPublic: boolean): Promise<void> => {
   if (!ownerId || !projectId) {
       throw new Error("Owner ID and Project ID are required to set public status.");
   }
  const projectDocRef = doc(db, `projects/${projectId}`);

  // Verify the owner is the one setting status (Security rules will also enforce this)
  const projectSnap = await getDoc(projectDocRef);
  if (!projectSnap.exists() || projectSnap.data().ownerId !== ownerId) {
    throw new Error("Project not found or user is not the owner.");
  }
  await updateDoc(projectDocRef, { isPublic, updatedAt: serverTimestamp() });
};


export { app, auth, db };

    