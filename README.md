# AI Roadmap Generator

This is a Next.js application built with Genkit that allows users to generate project roadmaps and detailed sub-roadmaps from natural language prompts. The generated roadmaps are then visualized as interactive and editable flow charts.

## Key Features

*   **AI-Powered Roadmap Generation:** Enter a project idea on the homepage, and the AI will generate a structured, step-by-step roadmap.
*   **AI-Powered Sub-Roadmap Generation:** For any step in the main roadmap, generate a more detailed sub-roadmap (a series of smaller steps) with AI, considering the context of the main project goal.
*   **Interactive Flowchart Visualization:** Roadmaps and sub-roadmaps are displayed as an editable flow chart using React Flow.
*   **Node Management:**
    *   **Edit:** Double-click step titles and descriptions to edit them directly on the node.
    *   **Mark as Done:** Toggle a step's completion status with a visual checkmark. Completed nodes are visually distinct and can auto-collapse.
    *   **Add Steps:** Add new steps sequentially after an existing step using a dedicated button on selected nodes.
    *   **Delete Steps:** Remove individual steps or multiple selected steps.
    *   **Expand/Collapse Descriptions:** Manually toggle the visibility of step descriptions. Buttons to expand/collapse all descriptions globally are also available.
*   **Theming:** Supports light, dark, and system themes, with a toggle for user preference.
*   **Responsive Sidebar:** A collapsible sidebar lists all main roadmap steps, allowing for easy navigation and selection to focus the flowchart view.
*   **Collapsible MiniMap:** A MiniMap for easy canvas navigation can be toggled on or off.
*   **Keyboard Shortcuts:**
    *   `Delete` / `Ctrl+X` (`Cmd+X` on Mac) to delete selected node(s).
*   **Toast Notifications:** Provides clear feedback for user actions like generation, updates, and deletions.
*   **Homepage:** A dedicated homepage to input the initial project prompt and (placeholder for) view existing projects.

## Tech Stack

*   **Next.js (App Router):** React framework for server-side rendering and static site generation.
*   **TypeScript:** For type safety and improved developer experience.
*   **Tailwind CSS & ShadCN UI:** For styling and pre-built UI components.
*   **React Flow:** For rendering interactive flowcharts.
*   **Genkit (with Google AI):** For AI-powered roadmap and sub-roadmap generation.
*   **Lucide Icons:** For UI icons.
*   **Zod:** For schema validation.
*   **React Hook Form:** (Implicitly used by ShadCN Form, good to note if complex forms are added).

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn

### Installation

1.  **Clone the repository (if applicable) or ensure you have the project files.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up Environment Variables:**
    Create a `.env` file in the root of your project and add your Google AI API key:
    ```env
    GOOGLE_API_KEY=YOUR_GOOGLE_AI_API_KEY
    ```
    You can obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Running the Development Server

1.  **Start the Genkit development server (for AI flow development/testing):**
    Open a terminal and run:
    ```bash
    npm run genkit:dev
    ```
    Or for watching changes:
    ```bash
    npm run genkit:watch
    ```
    This typically starts the Genkit inspector on `http://localhost:4000`.

2.  **Start the Next.js development server:**
    Open another terminal and run:
    ```bash
    npm run dev
    ```
    This will typically start the application on `http://localhost:9002`.

## Project Structure

*   `src/app/`: Contains the Next.js pages and layout.
    *   `src/app/page.tsx`: The homepage for inputting project prompts.
    *   `src/app/project/[projectId]/page.tsx`: The page for displaying and interacting with a specific roadmap.
    *   `src/app/layout.tsx`: The root layout.
*   `src/components/`: Contains reusable React components.
    *   `src/components/ui/`: ShadCN UI components (buttons, cards, dialogs, etc.).
    *   `src/components/roadmap/`: Components specific to roadmap display and interaction (ProjectHeader, RoadmapCanvas, RoadmapSidebar).
    *   `src/components/word-node.tsx`: Custom React Flow node component for roadmap steps.
    *   `src/components/theme-provider.tsx` & `src/components/theme-toggle.tsx`: Theme management.
*   `src/ai/`: Contains Genkit AI related code.
    *   `src/ai/genkit.ts`: Genkit global configuration.
    *   `src/ai/flows/generate-roadmap-flow.ts`: The Genkit flow for generating main roadmaps and sub-roadmaps.
*   `src/hooks/`: Custom React hooks.
    *   `src/hooks/useNodeManagement.ts`: Core logic for managing React Flow nodes and edges (creation, deletion, updates, sub-roadmap logic).
    *   `src/hooks/useToast.ts`: For displaying toast notifications.
    *   `src/hooks/use-mobile.tsx`: For detecting mobile viewports (used by ShadCN Sidebar).
*   `src/lib/`: Utility functions (e.g., `cn` for Tailwind class merging).
*   `public/`: Static assets.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate (if applicable).

## License

[MIT](https://choosealicense.com/licenses/mit/) (Assuming MIT, update if different)
