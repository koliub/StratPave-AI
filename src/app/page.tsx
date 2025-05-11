
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, FilePlus2, ListChecks } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

// Mock project data for now
const mockProjects = [
  { id: 'apple-farm', name: 'Build an Apple Tree Farm', lastModified: '2 days ago', description: 'Plan and execute the creation of a thriving apple orchard.' },
  { id: 'community-garden', name: 'Start a Community Garden', lastModified: '5 days ago', description: 'Bring the neighborhood together with a shared green space.' },
  { id: 'learn-coding', name: 'Learn to Code in 6 Months', lastModified: '1 week ago', description: 'A structured plan to acquire programming skills.' },
  { id: 'saas-product-launch', name: 'Launch New SaaS Product', lastModified: '3 days ago', description: 'Roadmap for developing and marketing a new software-as-a-service.'}
];


export default function HomePage() {
  const [prompt, setPrompt] = useState('');
  const router = useRouter();

  const handleCreateProject = () => {
    if (prompt.trim()) {
      router.push(`/project/new?prompt=${encodeURIComponent(prompt.trim())}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="p-4 border-b border-border shadow-sm sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
            <ListChecks className="h-7 w-7" />
            <span>AI Roadmap Generator</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Prompt Input Section */}
          <Card className="shadow-xl border-border hover:shadow-2xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <FilePlus2 className="mr-3 h-7 w-7 text-accent" />
                Create a New Roadmap
              </CardTitle>
              <CardDescription className="text-base">
                Tell us your vision. Our AI will draft a strategic plan to get you there.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input
                type="text"
                placeholder="e.g., Develop a mobile app for local artists..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="text-lg py-6 px-4 rounded-md"
                onKeyDown={(e) => { if (e.key === 'Enter' && prompt.trim()) handleCreateProject(); }}
                aria-label="Project idea prompt"
              />
              <Button 
                onClick={handleCreateProject} 
                className="w-full py-6 text-lg font-semibold" 
                size="lg" 
                disabled={!prompt.trim()}
              >
                Generate Your Roadmap
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>

          {/* Saved Projects Section */}
          <Card className="shadow-xl border-border hover:shadow-2xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-2xl">Your Projects</CardTitle>
              <CardDescription className="text-base">
                Revisit and continue working on your roadmaps. (Mock data)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mockProjects.length > 0 ? (
                <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                  {mockProjects.map((project) => (
                    <li key={project.id}>
                      <Link href={`/project/${project.id}?prompt=${encodeURIComponent(project.name)}`} passHref> {/* Pass prompt for mock projects */}
                        <Button 
                          variant="outline" 
                          className="w-full justify-between text-left h-auto p-4 group rounded-md border-border hover:border-accent transition-all"
                          aria-label={`Open project: ${project.name}`}
                        >
                          <div className="flex-grow mr-4">
                            <p className="font-semibold text-md text-card-foreground">{project.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{project.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">Last modified: {project.lastModified}</p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
                        </Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center py-6 text-base">
                  No projects saved yet. Start by generating a new roadmap!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="text-center p-6 border-t border-border text-sm text-muted-foreground mt-8">
        © {new Date().getFullYear()} AI Roadmap Generator. Powered by Next.js, Genkit, and love for planning.
      </footer>
    </div>
  );
}
