
# AI Roadmap Generator

This is a Next.js application that allows users to generate project roadmaps and detailed sub-roadmaps from natural language prompts. The generated roadmaps are then visualized as interactive and editable flow charts, with user authentication and project storage powered by Firebase.

## Key Features

*   **AI-Powered Roadmap Generation:** Enter a project idea, and the AI will generate a structured, step-by-step roadmap.
*   **AI-Powered Sub-Roadmap Generation:** For any step in the main roadmap, generate a more detailed sub-roadmap (a series of smaller steps) with AI, considering the context of the main project goal.
*   **Interactive Flowchart Visualization:** Roadmaps and sub-roadmaps are displayed as an editable flow chart using React Flow.
*   **Node Management:**
    *   **Edit:** Double-click step titles and descriptions to edit them directly on the node.
    *   **Mark as Done:** Toggle a step's completion status with a visual checkmark. Completed nodes are visually distinct and can auto-collapse.
    *   **Add Steps:** Add new steps sequentially after an existing step using a dedicated button on selected nodes.
    *   **Delete Steps:** Remove individual steps or multiple selected steps.
    *   **Expand/Collapse Descriptions:** Manually toggle the visibility of step descriptions. Buttons to expand/collapse all descriptions globally are also available.
*   **User Authentication:** Secure user accounts and project data using Firebase Authentication (Email/Password and Google Sign-In).
*   **Cloud Project Storage:** User-specific roadmaps are saved and retrieved from Firebase Firestore, allowing users to access their projects across sessions.
*   **Dashboard:** A central place for users to view their saved projects, create new ones, and manage existing roadmaps.
*   **Theming:** Supports light, dark, and system themes, with a toggle for user preference.
*   **Responsive Sidebar:** A collapsible sidebar lists all main roadmap steps, allowing for easy navigation and selection to focus the flowchart view.
*   **Collapsible MiniMap:** A MiniMap for easy canvas navigation can be toggled on or off.
*   **Keyboard Shortcuts:**
    *   `Delete` / `Ctrl+X` (`Cmd+X` on Mac) to delete selected node(s).
*   **Toast Notifications:** Provides clear feedback for user actions like generation, updates, and deletions.
*   **Landing Page:** A dedicated landing page to introduce the application and guide users to the dashboard.

## Tech Stack

*   **Next.js (App Router):** React framework for server-side rendering and static site generation.
*   **TypeScript:** For type safety and improved developer experience.
*   **Tailwind CSS & ShadCN UI:** For styling and pre-built UI components.
*   **React Flow:** For rendering interactive flowcharts.
*   **Firebase AI (Gemini):** For AI-powered roadmap and sub-roadmap generation (via `firebase/ai` SDK).
*   **Firebase Authentication:** For user sign-up, login, and session management.
*   **Firebase Firestore:** For storing and retrieving user-specific project data.
*   **Lucide Icons:** For UI icons.
*   **Zod:** For schema validation (primarily for AI output).
*   **React Hook Form:** (Implicitly used by ShadCN Form components, e.g., in auth forms).

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn
*   A Firebase project

### Installation

1.  **Clone the repository (if applicable) or ensure you have the project files.**
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Set up Firebase:**
    *   Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/).
    *   Add a Web app to your Firebase project.
    *   Enable **Authentication** and add "Email/Password" and "Google" as sign-in providers.
    *   Enable **Firestore** in Native mode.
    *   **Configure Firestore Security Rules:**
        ```json
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            // Users can only read/write their own projects
            match /projects/{projectId} {
              allow get: if resource.data.isPublic == true || (request.auth != null && (request.auth.uid == resource.data.ownerId || request.auth.uid in resource.data.sharedWithUserIds));
              allow list: if request.auth != null; // Refine based on actual query patterns
              allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
              allow update: if request.auth != null && request.auth.uid == resource.data.ownerId; // Extend for collaborators later
              allow delete: if request.auth != null && request.auth.uid == resource.data.ownerId;
            }

            // Users can manage their own user document
            match /users/{userId} {
              allow read, create: if request.auth != null && request.auth.uid == userId;
              allow update: if request.auth != null && request.auth.uid == userId && request.resource.data.keys().hasOnly(['lastLogin', 'displayName', 'photoURL', 'email']);
            }
          }
        }
        ```
    *   Copy your Firebase project's configuration object (apiKey, authDomain, projectId, etc.).
    *   Update the `firebaseConfig` object in `src/lib/firebase.ts` with your project's credentials:
        ```typescript
        // src/lib/firebase.ts
        const firebaseConfig: FirebaseOptions = {
          apiKey: "YOUR_ACTUAL_API_KEY",
          authDomain: "YOUR_ACTUAL_AUTH_DOMAIN",
          projectId: "YOUR_ACTUAL_PROJECT_ID",
          storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET",
          messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
          appId: "YOUR_ACTUAL_APP_ID"
        };
        ```
        Alternatively, set them up as environment variables as defined in `.env.example` and used in `src/lib/firebase.ts`.

### Running the Development Server

1.  **Start the Next.js development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    This will typically start the application on `http://localhost:9002`.

## Project Structure

*   `src/app/`: Contains the Next.js pages and layouts.
    *   `src/app/page.tsx`: The main landing page.
    *   `src/app/dashboard/page.tsx`: User dashboard for managing projects.
    *   `src/app/project/[projectId]/page.tsx`: The page for displaying and interacting with a specific roadmap.
    *   `src/app/layout.tsx`: The root layout.
*   `src/components/`: Contains reusable React components.
    *   `src/components/ui/`: ShadCN UI components.
    *   `src/components/auth/`: Authentication related components (LoginForm, SignUpForm, UserAuthSection).
    *   `src/components/roadmap/` (or `src/app/canvas/components/`): Components specific to roadmap display and interaction (ProjectHeader, RoadmapCanvas, RoadmapSidebar).
    *   `src/components/word-node.tsx` (or `src/app/canvas/components/word-node.tsx`): Custom React Flow node component for roadmap steps.
    *   `src/components/theme/`: Theme provider and toggle.
*   `src/ai/`: Contains AI related code.
    *   `src/ai/RoadmapNodeGen.ts`: Logic for generating roadmaps using Firebase AI (Gemini).
*   `src/hooks/`: Custom React hooks (e.g., `useNodeManagement`, `useAuth`, `useToast`).
*   `src/lib/`: Utility functions and Firebase configuration (`firebase.ts`, `utils.ts`).
*   `src/context/`: React Context providers (e.g., `AuthContext.tsx`).
*   `public/`: Static assets (images, logos).

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

(Specify your license here, e.g., MIT)
```
