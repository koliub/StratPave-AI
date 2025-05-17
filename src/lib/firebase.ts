
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { 
  getFirestore, 
  type Firestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import type { Node, Edge } from 'reactflow';
import type { WordNodeData } from '@/components/roadmap/word-node';

// Your web app's Firebase configuration
// IMPORTANT: Replace these with your actual Firebase project credentials
const firebaseConfig: FirebaseOptions = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // if already initialized, use that one
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

// Enable offline persistence for Firestore
try {
    enableIndexedDbPersistence(db, { cacheSizeBytes: CACHE_SIZE_UNLIMITED })
      .then(() => {
        console.log("Firestore offline persistence enabled.");
      })
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn("Firestore offline persistence could not be enabled (multiple tabs open or other issues).");
        } else if (err.code === 'unimplemented') {
          console.warn("Firestore offline persistence is not supported in this browser.");
        } else {
          console.error("Error enabling Firestore offline persistence:", err);
        }
      });
  } catch (error) {
    console.error("Error attempting to enable Firestore offline persistence:", error);
}
  

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
  title: string;
  prompt: string;
  nodes: ProjectNodeForFirestore[];
  edges: Edge[];
  createdAt: any; // serverTimestamp() or FieldValue
  updatedAt: any; // serverTimestamp() or FieldValue
}

export interface ProjectPreview extends Pick<Project, 'id' | 'title' | 'updatedAt' | 'createdAt' | 'ownerId' | 'isPublic'> {
  nodeCount: number;
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
    // Before updating, ensure the user has permission (is owner)
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
      sharedWithUserIds: [],
      isPublic: false,
      createdAt: serverTimestamp(), 
      updatedAt: serverTimestamp() 
    });
    return docRef.id;
  }
};

export const getProjectFromDb = async (currentUserId: string | null, projectId: string): Promise<Project | null> => {
  if (!projectId) return null;
  const projectDocRef = doc(db, `projects/${projectId}`);
  const projectSnap = await getDoc(projectDocRef);

  if (projectSnap.exists()) {
    const projectData = { id: projectSnap.id, ...projectSnap.data() } as Project;
    // Access control: public, owner, or shared with
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
      title: data.title || 'Untitled Project',
      updatedAt: data.updatedAt,
      createdAt: data.createdAt,
      ownerId: data.ownerId,
      isPublic: data.isPublic,
      nodeCount: data.nodes?.length || 0,
    });
  });

  sharedSnapshot.forEach((doc) => {
    if (!projectsMap.has(doc.id)) { // Avoid duplicates if user is owner and also in sharedWith
      const data = doc.data();
      projectsMap.set(doc.id, {
        id: doc.id,
        title: data.title || 'Untitled Project',
        updatedAt: data.updatedAt,
        createdAt: data.createdAt,
        ownerId: data.ownerId,
        isPublic: data.isPublic,
        nodeCount: data.nodes?.length || 0,
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
    if (projectSnap.data().ownerId === userId) {
      await deleteDoc(projectDocRef);
    } else {
      throw new Error("User does not have permission to delete this project.");
    }
  } else {
    console.warn("Project not found for deletion.");
  }
};

// --- Collaboration functions (skeletons for now) ---
export const shareProjectWithUser = async (ownerId: string, projectId: string, targetUserEmail: string): Promise<void> => {
  // 1. Find targetUser UID by email (requires a users collection where emails are stored, or a Cloud Function)
  // For simplicity, this is a placeholder. In a real app, you'd query your 'users' collection.
  // const usersRef = collection(db, 'users');
  // const q = query(usersRef, where("email", "==", targetUserEmail));
  // const querySnapshot = await getDocs(q);
  // if (querySnapshot.empty) throw new Error("User with that email not found.");
  // const targetUserId = querySnapshot.docs[0].id;

  // For now, let's assume targetUserId is known or passed directly
  const targetUserId = "PLACEHOLDER_TARGET_USER_ID"; // Replace with actual lookup

  const projectDocRef = doc(db, `projects/${projectId}`);
  const projectSnap = await getDoc(projectDocRef);

  if (!projectSnap.exists() || projectSnap.data().ownerId !== ownerId) {
    throw new Error("Project not found or user is not the owner.");
  }
  if (ownerId === targetUserId) {
    throw new Error("Cannot share project with yourself.");
  }

  await updateDoc(projectDocRef, {
    sharedWithUserIds: arrayUnion(targetUserId)
  });
};

export const unshareProjectWithUser = async (ownerId: string, projectId: string, targetUserId: string): Promise<void> => {
  const projectDocRef = doc(db, `projects/${projectId}`);
  const projectSnap = await getDoc(projectDocRef);

  if (!projectSnap.exists() || projectSnap.data().ownerId !== ownerId) {
    throw new Error("Project not found or user is not the owner.");
  }

  await updateDoc(projectDocRef, {
    sharedWithUserIds: arrayRemove(targetUserId)
  });
};

export const setProjectPublicStatus = async (ownerId: string, projectId: string, isPublic: boolean): Promise<void> => {
  const projectDocRef = doc(db, `projects/${projectId}`);
  const projectSnap = await getDoc(projectDocRef);

  if (!projectSnap.exists() || projectSnap.data().ownerId !== ownerId) {
    throw new Error("Project not found or user is not the owner.");
  }
  await updateDoc(projectDocRef, { isPublic });
};


export { app, auth, db };

    