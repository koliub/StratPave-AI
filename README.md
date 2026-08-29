
# AI Roadmap Generator

This is a Next.js application that allows users to generate project roadmaps and detailed sub-roadmaps from natural language prompts. The generated roadmaps are then visualized as interactive and editable flow charts, with user authentication and project storage powered by a local SQLite database.

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
*   **User Authentication:** Secure user accounts via Auth.js (Email/Password and optional Google Sign-In).
*   **Project Storage:** User-specific roadmaps are saved and retrieved from a local SQLite database (via Prisma), allowing users to access their projects across sessions.
*   **Pluggable AI Providers:** Bring your own API key for Anthropic (Claude), Google AI (Gemini), OpenRouter, or any custom OpenAI-compatible endpoint, configurable per-user from the Settings page.
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
*   **Pluggable AI providers:** Anthropic, Google AI, OpenRouter, or a custom OpenAI-compatible endpoint — for roadmap and sub-roadmap generation.
*   **Auth.js (NextAuth v5):** For user sign-up, login, and session management.
*   **Prisma + SQLite:** For storing and retrieving user-specific project data.
*   **Lucide Icons:** For UI icons.
*   **Zod:** For schema validation (primarily for AI output).
*   **React Hook Form:** (Implicitly used by ShadCN Form components, e.g., in auth forms).

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
    yarn install
    ```
3.  **Configure environment variables:**
    *   Copy `.env.example` to `.env`.
    *   Generate an `AUTH_SECRET` with `npx auth secret` (or any random string for local dev).
    *   `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are optional — leave them blank to skip Google sign-in and use email/password only.
4.  **Set up the database:**
    ```bash
    npm run db:push
    ```
    This creates `prisma/dev.db` (SQLite) with the required tables. `npm run db:studio` opens Prisma Studio to browse the data.
5.  **Configure an AI provider:**
    *   Sign up in the app, then open **AI Settings** from the account menu (or go to `/settings`).
    *   Pick a provider (Anthropic, Google AI, OpenRouter, or a custom OpenAI-compatible endpoint) and paste in your own API key. Each user configures their own key — there's no shared server-side key.

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
    *   `src/app/canvas/page.tsx`: The page for displaying and interacting with a specific roadmap, plus its components (`ProjectHeader`, `RoadmapCanvas`, `RoadmapSidebar`, `word-node.tsx`) in `src/app/canvas/components/`.
    *   `src/app/settings/page.tsx`: Per-user AI provider configuration.
    *   `src/app/layout.tsx`: The root layout.
*   `src/components/`: Contains reusable React components.
    *   `src/components/ui/`: ShadCN UI components.
    *   `src/components/auth/`: Authentication related components (LoginForm, SignUpForm, UserAuthSection).
    *   `src/components/theme/`: Theme provider and toggle.
*   `src/ai/`: Contains AI related code.
    *   `src/ai/RoadmapNodeGen.ts`: Server action dispatching to the user's active AI provider.
    *   `src/ai/providers/`: Anthropic, Google AI, OpenRouter, and custom-endpoint implementations, plus the provider factory (`index.ts`).
*   `src/hooks/`: Custom React hooks (e.g., `useNodeManagement`, `useAuth`, `useToast`).
*   `src/lib/`: Utility functions, the Prisma client singleton (`prisma.ts`), and the project/AI-credential data layer (`db/`).
*   `src/context/`: React Context providers (e.g., `AuthContext.tsx`, a compatibility shim over Auth.js).
*   `src/auth.ts`: Auth.js (NextAuth v5) configuration.
*   `prisma/schema.prisma`: Database schema (users, projects, shares, AI credentials).
*   `public/`: Static assets (images, logos).

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

(Specify your license here, e.g., MIT)
