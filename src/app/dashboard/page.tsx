// This is the Dashboard page component.
// It displays a list of the user's existing roadmaps and provides functionality to create a new one.

'use client';

// --- Imports Section ---
// Importing necessary React hooks.
import { useState, useEffect } from 'react';
// Importing Next.js components.
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// Importing UI components from the components directory.
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress'; // Keep Progress for now as requested
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
// Importing custom components.
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { UserAuthSection } from '@/components/auth/UserAuthSection'; // Import UserAuthSection
// Importing icons.
import { Loader2, PlusCircle, Trash2, FileText } from 'lucide-react';
// Importing hooks/contexts.
import { useTheme } from '@/components/theme/theme-provider';
// Assuming there is a hook or context to get the current user
// import { useAuthContext } from '@/context/AuthContext'; // Uncomment and use this if available
// Importing Firebase interaction functions and types.
import { getUserProjectsFromDb, deleteProjectFromDb, ProjectPreview } from '@/lib/firebase'; // Import firebase functions and types

// --- Dashboard Component Definition ---
export default function Dashboard() {
  // --- State Management Section ---
  // State for the input field for new roadmap title.
  const [roadmapTitle, setRoadmapTitle] = useState('');
  // State to store the list of user's projects (roadmaps).
  const [projects, setProjects] = useState<ProjectPreview[]>([]);
  // State to indicate if projects are currently being loaded.
  const [loading, setLoading] = useState(true);

  // --- Hooks and Contexts Section ---
  // Getting the router instance for navigation.
  const router = useRouter();
  // Getting the current theme from the theme provider.
  const { resolvedTheme: theme } = useTheme();
  // Determining the logo source based on the current theme.
  const logoSrc = theme === 'dark' ? '/logos/WhiteSymbolAndText_Logo_TransparentBG.png' : '/logos/SymbolAndText_Logo_TransparentBG.png';

  // --- Authentication Logic (Dummy) ---
  // TODO: Replace with real auth context user - using a dummy user for now
  // Getting the current authenticated user. Replace with real context hook.
  const currentUser = {
    uid: 'dummy-user-id'
  };
  // const { currentUser } = useAuthContext(); // Get current user from auth context

  // --- Data Fetching Logic (useEffect) ---
  // Effect hook to fetch user projects when the component mounts or user changes.
  useEffect(() => {
    // Async function to fetch projects from the database.
    const fetchProjects = async () => {
      // Check if a user is authenticated.
      if (!currentUser?.uid) {
        setLoading(false);
        setProjects([]);
        console.warn("No authenticated user found. Cannot fetch projects.");
        return;
      }
      try {
        setLoading(true);
        // Fetch projects accessible by the current user.
        const userProjects = await getUserProjectsFromDb(currentUser.uid);
        // TODO: Consider adding logic here to filter projects based on the logged-in user's specific access rights (e.g., ownership, shared access)
        // Update the state with the fetched projects.
        setProjects(userProjects);
      } catch (error) {
        // Log and handle errors during fetching.
        console.error("Error fetching projects:", error);
        // TODO: Implement user-facing error handling (e.g., toast notification)
      } finally {
        // Set loading to false after fetching is complete.
        setLoading(false);
      }
    };

    // Call the fetch projects function.
    fetchProjects();
    // Dependency array includes currentUser.uid to refetch if the user changes.
  }, [currentUser?.uid]);

  // --- Event Handlers Section ---
  // Handler for creating a new roadmap.
  const handleCreateRoadmap = () => {
    // Handle roadmap creation logic here.
    if (roadmapTitle.trim()) {
      // Store the roadmap title in session storage.
      sessionStorage.setItem('roadmapPrompt', roadmapTitle);
      console.log('Creating roadmap:', roadmapTitle);
      // Navigate to the /app page.
      router.push('/app');
      // Clear the input field.
      setRoadmapTitle('');
    } else {
      // TODO: Add user feedback for empty title.
      console.warn("Roadmap title cannot be empty.");
    }
  };

  // Handler for deleting a project.
  const handleDeleteProject = async (projectId: string) => {
    // Check if user is authenticated.
    if (!currentUser?.uid) {
      console.error("User not authenticated. Cannot delete project.");
      // TODO: Implement user-facing error handling
      return;
    }
    try {
      console.log('Deleting project:', projectId);
      // Call the firebase delete function.
      await deleteProjectFromDb(currentUser.uid, projectId);
      // Remove the deleted project from the local state to update the UI.
      setProjects(projects.filter(project => project.id !== projectId));
      // TODO: Implement user feedback for successful deletion (e.g., toast notification)
    } catch (error) {
      console.error("Error deleting project:", error);
      // TODO: Implement user-facing error handling
    }
  };

  // --- UI Utility Functions Section ---
  // Helper function to format timestamp.
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    // Firebase Timestamp has toDate() method.
    if (timestamp.toDate) {
      const date = timestamp.toDate();
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    // Handle other potential timestamp formats if necessary.
    return String(timestamp);
  };

  // --- Component Render Section ---
  return (
    <div>
      {/* Main content wrapper */}
      <main>
        {/* Layout container with fixed sidebar */}
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar Section - Static */}
          <div className="fixed inset-y-0 left-0 w-80 bg-gray-100 dark:bg-gray-800 p-4 overflow-y-auto text-black dark:text-white flex flex-col items-center">
            {/* Logo linking to the home page */}
            <Link href="/">
              <div className="mb-8">
                <Image src={logoSrc}
                  alt="Flowse Logo"
                  height={150}
                  width={150} // Adjust size as needed
                  style={{
                    cursor: 'pointer'
                  }}
                />
              </div>
            </Link>
            {/* Section title for user roadmaps */}
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <FileText className="mr-3 h-7 w-7 text-primary" />
              Your Roadmaps
            </h2>

            {/* Loading state or list of projects */}
            {loading ? (
              // Loading indicator.
              <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : projects.length === 0 ? (
              // Message when no projects are found.
              <p>No projects found. Create one above!</p>
            ) : (
              // Mapping and displaying each project as a Card.
              projects.map((project) => (
                // Use project.id as the key for list rendering.
                <Card key={project.id} className="mb-4 w-full transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 ">
                  {/* Link wrapping the card content to navigate to the project page */}
                  {/* Wrap CardContent in Link to make the card clickable, except for the dropdown */}
                  <Link href={`/app?id=${project.id}`} passHref legacyBehavior>
                    {/* legacyBehavior is needed if the child is not an <a> tag */}
                    <a className="block">
                      <CardContent className="p-4 cursor-pointer">
                        {/* Project title and delete button */}
                        <div className="flex justify-between items-center mb-2">
                          <CardTitle className="text-lg flex-grow overflow-hidden text-ellipsis whitespace-nowrap">{project.title || 'Untitled Project'}</CardTitle>
                          {/* Delete button within DropdownMenu - placed outside the Link but visually within the card */}
                          {/* To make the dropdown clickable and prevent link navigation, stop propagation */}
                          {/* The DropdownMenuTrigger needs to be clickable */}
                          {/* Dropdown menu for project actions (e.g., delete) */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              {/* Button to open the dropdown menu */}
                              {/* Button needs to be relatively positioned with a higher z-index */}
                              <Button variant="ghost" size="sm" className="relative z-10 p-1" onClick={(e) => e.stopPropagation()}> {/* Stop click propagation */}
                                <span className="sr-only">Actions</span>
                                {/* Delete icon */}
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            {/* Dropdown menu content */}
                            <DropdownMenuContent align="end">
                              {/* Dropdown menu item for deleting the project */}
                              {/* Stop propagation in MenuItem click handler as well */}
                              <DropdownMenuItem onClick={(e) => {
                                e.preventDefault(); // Prevent default link behavior if any
                                e.stopPropagation(); // Stop event from bubbling up to the CardContent/Link
                                handleDeleteProject(project.id!); // Call delete handler
                              }}>
                                Delete Project
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {/* Display Node Count */}
                        <div className="text-sm font-medium mb-2">
                          Nodes: {project.nodeCount}
                        </div>
                        {/* Display last updated timestamp */}
                        <div className="text-sm text-gray-500">
                          Last updated: {formatTimestamp(project.updatedAt)}
                        </div>
                        {/* Retain dummy progress bar structure as requested, but no dynamic value */}
                        <Progress value={75} className="mb-2 [&>div]:bg-gradient-to-r [&>div]:from-teal-400 [&>div]:to-blue-600" /> 
                         <div className="text-sm text-gray-500">
                            '75'
                          </div> 
                      </CardContent>
                    </a>
                  </Link>
                </Card>
              ))
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col ml-80 transition-all duration-300">
            {/* Header Section */}
            <div className="flex justify-end p-4">
              {/* Theme toggle component */}
              <ThemeToggle />
              {/* User authentication section */}
              <UserAuthSection /> {/* Add the UserAuthSection component here */}
            </div>

            {/* Centered Content Section (Roadmap Creation) */}
            <div className="flex-1 flex items-center justify-center p-6">
              {/* Container for the create roadmap input and button */}
              <div className="w-full max-w-md flex flex-col items-center transition-all duration-300">
                {/* Title for the roadmap creation section */}
                <h1 className="text-4xl tracking-tighter sm:text-5xl md:text-6xl xl:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-teal-500 py-2">Create Roadmap</h1>
                {/* Input and button container */}
                <div className="flex w-full space-x-2">
                  {/* Input field for entering the roadmap title */}
                  <Input
                    type="text"
                    placeholder="Enter roadmap title" // Placeholder for dynamic input
                    value={roadmapTitle}
                    onChange={(e) => setRoadmapTitle(e.target.value)}
                    className="flex-grow rounded-full"
                    // Handle Enter key press to trigger roadmap creation
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateRoadmap();
                      }
                    }}
                  />
                  {/* Button to create the roadmap */}
                  <Button onClick={handleCreateRoadmap} className="rounded-full bg-blue-500 hover:bg-blue-600 text-white">
                    <PlusCircle className="mr-2" size={18} /> Create Roadmap
                    </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Footer Section */}
      <footer className="py-6 md:px-8 border-t bg-background/80">
        <div className="container flex flex-col items-center justify-between gap-2 md:h-16 md:flex-row">
          {/* Application logo and copyright information */}
          <div className="flex items-center space-x-2">
            <Image
              src="/logos/Symbol_Logo_TransparentBG.png" // Make sure this exists
              alt="StratPave Icon"
              width={24}
              height={24}
              className="h-6 w-auto"
            />
            <p className="text-balance text-center text-xs leading-loose text-muted-foreground md:text-left">
              StratPave &copy; {new Date().getFullYear()}. Plan Smarter. Build Faster.
            </p>
          </div>
          {/* All rights reserved text */}
          <p className="text-center text-xs text-muted-foreground/70">
            All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}