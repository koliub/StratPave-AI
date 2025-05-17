
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
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import type { Node, Edge } from 'reactflow';
import type { WordNodeData } from '@/components/roadmap/word-node';

// Your web app's Firebase configuration
// IMPORTANT: Replace these with your actual Firebase project credentials
// You can get these from your Firebase project settings.
const firebaseConfig: FirebaseOptions = {
  apiKey: "YOUR_API_KEY", // process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "YOUR_AUTH_DOMAIN", // process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: "YOUR_PROJECT_ID", // process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: "YOUR_STORAGE_BUCKET", // process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: "YOUR_APP_ID", // process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: "YOUR_MEASUREMENT_ID" // process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID (Optional)
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
// This should be called only once, as early as possible.
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
export interface RoadmapNodeDataForFirestore extends Omit<WordNodeData, 
  'onToggleDone' | 
  'onUpdateNodeData' | 
  'onDeleteNode' | 
  'onAddNodeAfter' | 
  'onManualToggleExpansion' |
  'onUpdateNodeColor' |
  'onGenerateSubRoadmap' |
  'subRoadmapNodes' | // Avoid deep nesting if subRoadmapNodes also have callbacks
  'subRoadmapEdges'   // Keep subRoadmapEdges simple
> {
  // Add any specific Firestore-only fields if needed
}

export interface RoadmapNodeForFirestore extends Omit<Node<RoadmapNodeDataForFirestore>, 'data'> {
  data: RoadmapNodeDataForFirestore;
}

export interface Roadmap {
  id?: string; // ID from Firestore, optional if new
  userId: string;
  title: string;
  prompt: string;
  nodes: RoadmapNodeForFirestore[];
  edges: Edge[];
  createdAt: any; // serverTimestamp() or FieldValue
  updatedAt: any; // serverTimestamp() or FieldValue
  isPublic?: boolean; // Optional: for sharing later
}

export interface RoadmapPreview extends Pick<Roadmap, 'id' | 'title' | 'updatedAt' | 'createdAt'> {
  // Any other preview-specific fields
  nodeCount: number;
}


// Utility to strip callbacks from WordNodeData for Firestore
export const toFirestoreNodeData = (nodeData: WordNodeData): RoadmapNodeDataForFirestore => {
  const { 
    onToggleDone, 
    onUpdateNodeData, 
    onDeleteNode, 
    onAddNodeAfter, 
    onManualToggleExpansion,
    onUpdateNodeColor,
    onGenerateSubRoadmap,
    subRoadmapNodes, // These might need special handling if they also contain callbacks or are deeply nested
    subRoadmapEdges,
    ...restOfData 
  } = nodeData;
  
  // For now, we're not storing subRoadmapNodes/Edges directly in this simplified version
  // to avoid deep nesting issues with callbacks. You might store them as separate documents
  // or handle their serialization/deserialization carefully if needed.
  return {
    ...restOfData,
    // If subRoadmapNodes/Edges are simple data (no callbacks), you can include them.
    // Otherwise, they might need their own toFirestore conversion.
  };
};

export const toFirestoreNodes = (nodes: Node<WordNodeData>[]): RoadmapNodeForFirestore[] => {
  return nodes.map(node => ({
    ...node,
    data: toFirestoreNodeData(node.data),
  }));
};


// Firestore service functions
export const saveRoadmapToDb = async (userId: string, roadmapId: string | null, roadmapData: Omit<Roadmap, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  if (!userId) throw new Error("User ID is required to save roadmap.");
  
  const roadmapCollectionRef = collection(db, `users/${userId}/roadmaps`);
  let docRef;

  if (roadmapId) {
    docRef = doc(roadmapCollectionRef, roadmapId);
    await setDoc(docRef, { ...roadmapData, updatedAt: serverTimestamp() }, { merge: true });
    return roadmapId;
  } else {
    docRef = doc(roadmapCollectionRef); // Firestore generates new ID
    await setDoc(docRef, { 
      ...roadmapData, 
      userId,
      createdAt: serverTimestamp(), 
      updatedAt: serverTimestamp() 
    });
    return docRef.id;
  }
};

export const getRoadmapFromDb = async (userId: string, roadmapId: string): Promise<Roadmap | null> => {
  if (!userId || !roadmapId) return null;
  const roadmapDocRef = doc(db, `users/${userId}/roadmaps/${roadmapId}`);
  const roadmapSnap = await getDoc(roadmapDocRef);

  if (roadmapSnap.exists()) {
    return { id: roadmapSnap.id, ...roadmapSnap.data() } as Roadmap;
  } else {
    console.log("No such roadmap!");
    return null;
  }
};

export const getUserRoadmapsFromDb = async (userId: string): Promise<RoadmapPreview[]> => {
  if (!userId) return [];
  const roadmapsCollectionRef = collection(db, `users/${userId}/roadmaps`);
  const q = query(roadmapsCollectionRef, orderBy("updatedAt", "desc"));
  
  const querySnapshot = await getDocs(q);
  const roadmaps: RoadmapPreview[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    roadmaps.push({
      id: doc.id,
      title: data.title || 'Untitled Roadmap',
      updatedAt: data.updatedAt,
      createdAt: data.createdAt,
      nodeCount: data.nodes?.length || 0,
    });
  });
  return roadmaps;
};

export const deleteRoadmapFromDb = async (userId: string, roadmapId: string): Promise<void> => {
  if (!userId || !roadmapId) throw new Error("User ID and Roadmap ID are required to delete roadmap.");
  const roadmapDocRef = doc(db, `users/${userId}/roadmaps/${roadmapId}`);
  await deleteDoc(roadmapDocRef);
};

export { app, auth, db };
