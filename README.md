# AI Roadmap Generator

This is a Next.js application built with Firebase and Genkit that allows users to generate project roadmaps from natural language prompts. The generated roadmap is then visualized as an interactive flow chart.

## Key Features

*   **AI-Powered Roadmap Generation:** Enter a project idea, and the AI will generate a structured, step-by-step roadmap.
*   **Interactive Flowchart Visualization:** Roadmaps are displayed as an editable flow chart using React Flow.
*   **Node Management:**
    *   Edit step titles and descriptions.
    *   Mark steps as "done".
    *   Add new steps after existing ones.
    *   Delete steps.
    *   Expand/collapse step descriptions.
*   **Theming:** Supports light, dark, and system themes.
*   **Responsive Sidebar:** A collapsible sidebar lists all roadmap steps for easy navigation and selection.
*   **Keyboard Shortcuts:**
    *   `Delete` / `Ctrl+X` (`Cmd+X` on Mac) to delete selected node(s).
*   **Toast Notifications:** Provides feedback for user actions.

## Tech Stack

*   **Next.js (App Router):** React framework for server-side rendering and static site generation.
*   **TypeScript:** For type safety and improved developer experience.
*   **Tailwind CSS & ShadCN UI:** For styling and pre-built UI components.
*   **React Flow:** For rendering interactive flowcharts.
*   **Genkit (with Google AI):** For AI-powered roadmap generation.
*   **Lucide Icons:** For UI icons.
*   **Zod:** For schema validation.

## Getting Started

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn

### Installation

1.  **Clone the repository (if applicable) or ensure you have the project files.**
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
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

2.  **Start the Next.js development server:**
    Open another terminal and run:
    ```bash
    npm run dev
    ```
    This will typically start the application on `http://localhost:9002`.

## Project Structure

*   `src/app/`: Contains the Next.js pages and layout.
    *   `src/app/page.tsx`: The main page for the roadmap generator.
    *   `src/app/layout.tsx`: The root layout.
*   `src/components/`: Contains reusable React components.
    *   `src/components/ui/`: ShadCN UI components.
    *   `src/components/word-node.tsx`: Custom React Flow node component.
    *   `src/components/theme-provider.tsx` & `src/components/theme-toggle.tsx`: Theme management.
*   `src/ai/`: Contains Genkit AI related code.
    *   `src/ai/genkit.ts`: Genkit configuration.
    *   `src/ai/flows/generate-roadmap-flow.ts`: The Genkit flow for generating roadmaps.
*   `src/lib/`: Utility functions.
*   `src/hooks/`: Custom React hooks.
*   `public/`: Static assets.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/) (Assuming MIT, update if different)
