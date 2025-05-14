'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';

const dummyProjects = [
  { id: 1, title: 'Project A', progress: 75, status: 'in progress' },
  { id: 2, title: 'Project B', progress: 100, status: 'completed' },
  { id: 3, title: 'Project C', progress: 30, status: 'in progress' },
];

export default function Dashboard() {
  const [roadmapTitle, setRoadmapTitle] = useState('');
  const router = useRouter();


  const handleCreateRoadmap = () => {
    // Handle roadmap creation logic here
    sessionStorage.setItem('roadmapPrompt', roadmapTitle);
    console.log('Creating roadmap:', roadmapTitle);
    router.push('/app');
    setRoadmapTitle('');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Static */}  
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-100 dark:bg-gray-800 p-4 overflow-y-auto text-black dark:text-white">
        <h2 className="text-xl font-bold mb-4 text-black">Recent Projects</h2>
        {dummyProjects.map((project) => (
          <Card key={project.id} className="mb-4 transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer ">
            <CardContent className="p-4">
              <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
              <div className="text-sm text-gray-500 mb-2">
                Progress: {project.progress}% {/* Placeholder for dynamic progress */}
              </div>
              <Progress value={project.progress} className="mb-2 [&>div]:bg-gradient-to-r [&>div]:from-teal-400 [&>div]:to-blue-600" />
              <div className="text-sm text-gray-500">
                Status: {project.status}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-64 transition-all duration-300">
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
            <h1 className="text-2xl font-bold mb-4">Create Roadmap</h1>
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