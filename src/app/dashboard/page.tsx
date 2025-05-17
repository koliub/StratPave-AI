'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Loader2, PlusCircle, Trash2, LogIn, FileText } from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { useTheme } from '@/components/theme/theme-provider';
const dummyProjects = [
  { id: 1, title: 'Project A', progress: 75, status: 'in progress' },
  { id: 2, title: 'Project B', progress: 100, status: 'completed' },
  { id: 3, title: 'Project C', progress: 30, status: 'in progress' },
];

export default function Dashboard() {
  const [roadmapTitle, setRoadmapTitle] = useState('');
  const router = useRouter();
  const { resolvedTheme: theme } = useTheme();
  const logoSrc = theme === 'dark' ? '/logos/WhiteSymbolAndText_Logo_TransparentBG.png' : '/logos/SymbolAndText_Logo_TransparentBG.png';


  const handleCreateRoadmap = () => {
    // Handle roadmap creation logic here
    sessionStorage.setItem('roadmapPrompt', roadmapTitle);
    console.log('Creating roadmap:', roadmapTitle);
    router.push('/app');
    setRoadmapTitle('');
  };

  const handleDeleteProject = (projectId: number) => {
    console.log('Deleting project:', projectId);
    // Implement actual delete logic here
  };

  return (
    <div>
      <main>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar - Static */}
        <div className="fixed inset-y-0 left-0 w-80 bg-gray-100 dark:bg-gray-800 p-4 overflow-y-auto text-black dark:text-white flex flex-col items-center">
          <Link href="/">
            <div className="mb-8">
                <Image src={logoSrc}
                alt="Flowse Logo"
                height={150}
                width={150} // Adjust size as needed
                  style={{ cursor: 'pointer' }}
                />
            </div>
          </Link>
            <h2 className="text-2xl font-semibold mb-6 flex items-center">
              <FileText className="mr-3 h-7 w-7 text-primary" />
              Your Roadmaps
            </h2>
            {dummyProjects.map((project) => (
              <Card key={project.id} className="mb-4 w-full transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer ">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          ...
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDeleteProject(project.id)}>
                          Delete
                          <Trash2 className="mr-3 h-7 w-7 text-primary" />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="text-sm font-medium mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${project.status === 'in progress' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200' : 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'}`}>
                      {project.status}
                    </span>
                  </div>
                  <Progress value={project.progress} className="mb-2 [&>div]:bg-gradient-to-r [&>div]:from-teal-400 [&>div]:to-blue-600" />
                  <div className="text-sm text-gray-500">
                    {project.progress}%
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col ml-80 transition-all duration-300">
          {/* Header */}
          <div className="flex justify-end p-4">
            <ThemeToggle />
            <Avatar className="ml-4">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>

          {/* Centered Content */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md flex flex-col items-center transition-all duration-300">
              <h1 className="text-4xl tracking-tighter sm:text-5xl md:text-6xl xl:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-teal-500 py-2">Create Roadmap</h1>
              <div className="flex w-full space-x-2">
                <Input
                  type="text"
                  placeholder="Enter roadmap title" // Placeholder for dynamic input
                  value={roadmapTitle}
                  onChange={(e) => setRoadmapTitle(e.target.value)}
                  className="flex-grow rounded-full"
                />
                <Button onClick={handleCreateRoadmap} className="rounded-full bg-blue-500 hover:bg-blue-600 text-white">Create Roadmap</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      

    </main>
    {/* Footer */}
    <footer className="py-6 md:px-8 border-t bg-background/80">
        <div className="container flex flex-col items-center justify-between gap-2 md:h-16 md:flex-row">
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
           <p className="text-center text-xs text-muted-foreground/70">
            All rights reserved.
          </p>
        </div>
      </footer>

  </div>
    
    
  );
}