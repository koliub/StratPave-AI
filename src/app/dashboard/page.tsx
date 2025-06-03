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
import { UserAuthSection } from '@/components/auth/UserAuthSection';
// Importing icons.
import { Loader2, PlusCircle, Trash2, FileText, Pencil, Repeat2, EllipsisVertical, WandSparkles, Sparkles} from 'lucide-react';
// Importing hooks/contexts.
import { useTheme } from '@/components/theme/theme-provider';
// Importing the correct auth hook
import { useAuth } from '@/context/AuthContext';
// Importing Firebase interaction functions and types.
import { getUserProjectsFromDb, deleteProjectFromDb, shareProjectWithUser, updateProjectTitleInDb, ProjectPreview } from '@/lib/firebase'; // Import firebase functions and types

// --- Dashboard Component Definition ---
export default function Dashboard() {
  // --- State Management Section ---
  // State for the input field for new roadmap title.
  const [pormptText, setPrompt] = useState('');
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

  // --- Authentication Logic ---
  // Getting the current authenticated user from auth context.
  const { user } = useAuth(); // Corrected: use useAuth and access user

  // --- Data Fetching Logic (useEffect) ---
  // Effect hook to fetch user projects when the component mounts or user changes.
  useEffect(() => {
    // Async function to fetch projects from the database.
    const fetchProjects = async () => {
      // Check if a user is authenticated.
      if (!user?.uid) { // Corrected: use user?.uid
        // If no authenticated user, set loading to false and clear projects.
        setLoading(false);
        setProjects([]);
        console.warn("No authenticated user found. Cannot fetch projects.");
        return;
      }
      try {
        setLoading(true);
        // Fetch projects accessible by the current user.
        const userProjects = await getUserProjectsFromDb(user.uid); // Corrected: use user.uid
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

    // Call the fetch projects function only if user is logged in.
    if (user?.uid) { // Corrected: use user?.uid
      fetchProjects();
    } else {
       // If not logged in, set loading to false immediately.
      setLoading(false);
      setProjects([]); // Ensure projects are empty if not logged in
    }

    // Dependency array includes user?.uid to refetch if the user changes.
  }, [user?.uid]); // Corrected: use user?.uid

  // --- Event Handlers Section ---
  // Handler for creating a new roadmap.
  const handleCreateRoadmap = () => {
    // Handle roadmap creation logic here.
    if (pormptText.trim()) {
      // Store the roadmap title in session storage.
      sessionStorage.setItem('roadmapPrompt', pormptText);
      console.log('Creating roadmap:', pormptText);
      // Navigate to the /app page.
      router.push('/canvas');
      // Clear the input field.
      setPrompt('');
    } else {
      // TODO: Add user feedback for empty title.
      console.warn("Roadmap title cannot be empty.");
    }
  };

  // Handler for deleting a project.
  const handleDeleteProject = async (projectId: string) => {
    // Check if user is authenticated.
    if (!user?.uid) { // Corrected: use user?.uid
      console.error("User not authenticated. Cannot delete project.");
      // TODO: Implement user-facing error handling
      return;
    }
    try {
      console.log('Deleting project:', projectId);
      // Call the firebase delete function.
      await deleteProjectFromDb(user.uid, projectId); // Corrected: use user.uid
      // Remove the deleted project from the local state to update the UI.
      setProjects(projects.filter(project => project.id !== projectId));
      // TODO: Implement user feedback for successful deletion (e.g., toast notification)
    } catch (error) {
      console.error("Error deleting project:", error);
      // TODO: Implement user-facing error handling
    }
  };
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState<string>('');
  const [shareInput, setShareInput] = useState<string>('');
  
  // Handler for sharing a project.
  const handleShareProject = async (projectId: string) => {
    if (!user?.uid) {
      console.error("User not authenticated. Cannot share project.");
      return;
    }
  
    const targetUID = prompt("Enter the user-ID of the user to share this project with (You can find it under Your Email when you click on your profile)");
    if (!targetUID) {
      console.log("Sharing cancelled. No User-ID provided.");
      return;
    }
  
    try {
      await shareProjectWithUser(user.uid, projectId, targetUID);
      console.log(`Project shared with ${targetUID}`);
      // Optional: show toast/notification to the user
    } catch (error: any) {
      console.error("Error sharing project:", error.message || error);
      // Optional: show error to the user (toast, alert, etc.)
      alert(`Failed to share project: ${error.message || "Unknown error"}`);
    }
  };
  
  

  // Handler for changing project title.
  const handleChangeTitle = async (projectId: string) => {
    if (!user?.uid) { // Corrected: use user?.uid
      console.error("User not authenticated. Cannot change title project.");
      // TODO: Implement user-facing error handling
      return;
    }
    if (editingProjectId === projectId) {
      // Save new title
      try {
        console.log(`Saving new title "${newTitle}" for project ${projectId}`);
        await updateProjectTitleInDb(user.uid, projectId, newTitle);
  
        setProjects(prev =>
          prev.map(p =>
            p.id === projectId ? { ...p, projectTitle: newTitle } : p
          )
        );
        setEditingProjectId(null);
        setNewTitle('');
      } catch (error) {
        console.error("Error updating project title:", error);
        // TODO: user-facing error handling
      }
    } else {
      // Enter edit mode
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setEditingProjectId(projectId);
        setNewTitle(project.projectTitle);
      }
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

            {/* Conditional rendering based on auth status and loading state */}
            {!user?.uid ? ( // Corrected: use user?.uid
              // Display message if user is not logged in
              <p className="text-center">Login to save your Roadmaps.</p>
            ) : loading ? ( // This loading state is for fetching projects, not auth
              // Loading indicator if user is logged in and projects are loading
              <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : projects.length === 0 ? (
              // Message when user is logged in but no projects are found.
              <p>No projects found. Create one above!</p>
            ) : (
              // Mapping and displaying each project as a Card when user is logged in and projects are available.
              projects.map((project) => (
                // Use project.id as the key for list rendering.
                <Card key={project.id} className="mb-4 w-full transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 ">
                  {/* Link wrapping the card content to navigate to the project page */}
                  {/* Wrap CardContent in Link to make the card clickable, except for the dropdown */}
                  <Link href={`/canvas?id=${project.id}`} passHref legacyBehavior>
                    {/* legacyBehavior is needed if the child is not an <a> tag */}
                    <a className="block">
                      <CardContent className="p-4 cursor-pointer">
                        {/* Project title and delete button */}
                        <div className="flex justify-between items-center mb-2">
                        {editingProjectId === project.id ? (
                          <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onBlur={() => handleChangeTitle(project.id!)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleChangeTitle(project.id!);
                            }}
                            className="text-lg flex-grow overflow-hidden text-ellipsis whitespace-nowrap"
                            autoFocus
                          />
                        ) : (
                          <CardTitle className="text-lg flex-grow overflow-hidden text-ellipsis whitespace-nowrap">
                            {project.projectTitle}
                          </CardTitle>
                        )}
                      {/* Dropdown menu for project actions (e.g., delete) */}
                          {/* To make the dropdown clickable and prevent link navigation, stop propagation */}
                          {/* The DropdownMenuTrigger needs to be clickable */}
                          {/* Button to open the dropdown menu - placed outside the Link but visually within the card */}
                          {/* Button needs to be relatively positioned with a higher z-index */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="relative z-10 p-1" onClick={(e) => e.stopPropagation()}> {/* Stop click propagation */}
                                <span className="sr-only">Actions</span>
                                {/* Using FileText as a placeholder icon for the dropdown trigger */}
                                <EllipsisVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            {/* Dropdown menu content */}
                            <DropdownMenuContent align="end">
                              {/* Dropdown menu item for sharing the project */}
                              <DropdownMenuItem onClick={(e) => {
                                e.preventDefault(); // Prevent default link behavior if any
                                e.stopPropagation(); // Stop event from bubbling up
                                handleShareProject(project.id!); // Call share handler
                              }}>
                                <Repeat2 className="h-4 w-4" /> Share 
                              </DropdownMenuItem>
                              {/* Dropdown menu item for changing the title */}
                              <DropdownMenuItem onClick={(e) => {
                                e.preventDefault(); // Prevent default link behavior if any
                                e.stopPropagation(); // Stop event from bubbling up
                                handleChangeTitle(project.id!); // Call change title handler
                              }}>
                                <Pencil className="h-4 w-4" /> Edit Title
                              </DropdownMenuItem>
                               {/* Dropdown menu item for deleting the project */}
                              {/* Stop propagation in MenuItem click handler as well */}
                              
                              <DropdownMenuItem onClick={(e) => {
                                e.preventDefault(); // Prevent default link behavior if any
                                e.stopPropagation(); // Stop event from bubbling up to the CardContent/Link
                                handleDeleteProject(project.id!); // Call delete handler
                              }}>
                                <Trash2 className="h-4 w-4" /> Delete 
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {/* Display Node Count */}
                        <div className="text-sm font-medium mb-2">
                          Steps: {project.nodeCount}
                        </div>
                        {/* Display last updated timestamp */}
                        <div className="text-sm text-gray-500">
                          Last updated: {formatTimestamp(project.updatedAt)}
                        </div>
                        {/* Retain dummy progress bar structure as requested, but no dynamic value */}
                        <div className="flex items-center gap-2">
                          {/* Add bg-gray-200 for the background */}
                          <Progress value={(project.completedNodes/project.totalNodes)*100} className="mb-2 [&>div]:bg-gradient-to-r [&>div]:from-teal-400 [&>div]:to-blue-600 bg-gray-200 dark:bg-gray-600" />
                           {/* Add percentage text at the end */}
                           <span className="text-sm text-gray-700 dark:text-gray-300">
                             {((project.completedNodes/project.totalNodes)*100).toFixed(0)}%
                           </span>
                        </div>
                         <div className="text-sm text-gray-500 mt-2"> {/* Added mt-2 for spacing */}
                                                    <div className={`text-sm font-medium mb-2 inline-block px-2 py-0.5 rounded-full ${project.completedNodes === project.totalNodes && project.totalNodes > 0 ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'}`}>
                          {project.completedNodes === project.totalNodes && project.totalNodes > 0 ? 'Completed' : 'In Progress'}
                        </div>
                            
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
            <div className="flex-1 flex items-center justify-center p-8 bg-muted rounded-2xl shadow-lg">
              {/* Container for the create roadmap input and button */}
              <div className="w-full max-w-2xl flex flex-col items-center space-y-6 transition-all duration-300">
                
                {/* Title for the roadmap creation section */}
                
                <h1 className="flex items-center justify-center text-5xl sm:text-6xl md:text-7xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-teal-500 space-x-4">
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-primary mr-3" />
                  <span>Create Roadmap</span>
                </h1>
                
                {/* Instructional Text */}
                <p className="text-center text-muted-foreground text-base sm:text-lg leading-relaxed">
                  To generate a roadmap:
                  <br />
                  1. Enter your project goal or topic in the input box.<br />
                  2. Click the <strong>"Create Roadmap"</strong> button or press <kbd>Enter</kbd>.<br />
                  3. You’ll be directed to the canvas to view and edit your roadmap.
                </p>
                
                {/* Input and button container */}
                <div className="flex w-full space-x-3">
                  {/* Input field for entering the roadmap title */}
                  <Input
                    type="text"
                    placeholder="Enter your project idea..."
                    value={pormptText}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-grow rounded-full px-5 py-3 shadow-inner"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateRoadmap();
                      }
                    }}
                  />
                  
                  {/* Button to create the roadmap */}
                  <Button 
                    onClick={handleCreateRoadmap} 
                    className="rounded-full px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold shadow hover:brightness-110"
                  >
                    <PlusCircle className="mr-2" size={18} /> Create
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