'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { useTheme } from '@/components/theme-provider';
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
          <h2 className="text-xl font-bold mb-4 text-black">Recent Projects</h2>
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
  );
}