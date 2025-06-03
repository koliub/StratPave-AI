
"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Brain, Zap, Workflow, Layers, Code, ShieldCheck, Users, Eye, Edit } from 'lucide-react'; 
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme/theme-toggle';
//import { UserAuthSection } from '@/components/UserAuthSection'; // Import UserAuthSection
import { useTheme } from '@/components/theme/theme-provider';

export default function LandingPage() {
  const { resolvedTheme } = useTheme();
  const logoSrc = resolvedTheme === 'dark' ? '/logos/WhiteSymbolAndText_Logo_TransparentBG.png' : '/logos/SymbolAndText_Logo_TransparentBG.png';

  return (
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-50">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/30 dark:border-border/50 bg-background/80 dark:bg-background/70 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-6 mx-auto">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src={logoSrc}
              alt="StratPave Logo"
              width={128}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <Button variant="ghost" asChild className="text-foreground/80 hover:text-primary">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" asChild className="text-foreground/80 hover:text-primary">
              <Link href="#features">Features</Link>
            </Button>
            <Button variant="ghost" asChild className="text-foreground/80 hover:text-primary">
               <Link href="#tech-stack">Technology</Link>
            </Button>
            <ThemeToggle />
            <div className="hidden sm:flex"> {/* Hide UserAuthSection on small screens if Get Started button is preferred */}
             {/* <UserAuthSection /> */}    
            </div>
             <Link href="/dashboard" legacyBehavior passHref>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-shadow sm:hidden"> {/* Show only on small screens */}
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative w-full py-20 md:py-32 lg:py-40 xl:py-48 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/RoadmapBackground.png"
              alt="Abstract Background" 
              layout="fill" 
              objectFit="cover" 
              quality={80} 
              className="opacity-20 dark:opacity-20" 
              priority
              data-ai-hint="abstract futuristic"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-background via-transparent to-background opacity-60 dark:opacity-70"></div>
          </div>
          
          <div className="container mx-auto max-w-7xl relative z-10">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="flex flex-col justify-center space-y-6">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl xl:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-teal-500 py-2">
                  AI-Powered Project Roadmapping
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl lg:text-lg xl:text-xl">
                  Turn your complex ideas into clear, actionable plans. StratPave uses AI to generate detailed roadmaps and visualizes them as interactive, editable flowcharts.
                </p>
                <div className="flex flex-col gap-3 min-[400px]:flex-row pt-4">
                  <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105">
                    <Link href="/dashboard">
                      Launch App
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="border-primary/50 text-primary hover:bg-primary/5 dark:hover:bg-primary/10 shadow-lg transition-transform hover:scale-105">
                     <Link href="#features">
                        Learn More
                     </Link>
                  </Button>
                </div>
              </div>
              <div className="hidden lg:flex items-center justify-center p-4 md:p-8">
                <Image 
                  src="/images/HappyPeople.webp"
                  alt="StratPave Roadmap Illustration" 
                  width={600} 
                  height={450} 
                  className="rounded-xl shadow-2xl transform hover:scale-105 transition-transform duration-500 border border-border/20" 
                  data-ai-hint="roadmap flowchart planning"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-16 md:py-24 lg:py-32 bg-background/70 dark:bg-background/50">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12 lg:mb-16">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-primary font-medium">
                Key Features
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">
                Everything You Need to Plan Success
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                StratPave offers a suite of powerful tools to streamline your project planning, from initial idea to detailed execution steps, all powered by intelligent AI.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-3">
              {[
                { icon: Brain, title: "AI Roadmap Generation", description: "Instantly generate comprehensive roadmaps from simple text prompts using advanced AI.", color: "text-pink-600 dark:text-pink-400" },
                { icon: Workflow, title: "Interactive Flowcharts", description: "Visualize and edit your projects with an intuitive React Flow canvas.", color: "text-blue-600 dark:text-blue-400" },
                { icon: Layers, title: "Detailed Sub-Roadmaps", description: "Break down complex tasks into manageable sub-steps for greater clarity and control.", color: "text-purple-600 dark:text-purple-400" },
                { icon: Users, title: "User Accounts & Storage", description: "Securely save and manage your personal roadmaps with Firebase Authentication and Firestore.", color: "text-green-600 dark:text-green-400" },
                { icon: Edit, title: "Intuitive Editing", description: "Easily edit titles, descriptions, mark steps as complete, and add new steps on the fly.", color: "text-orange-600 dark:text-orange-400" },
                { icon: Eye, title: "Customizable View", description: "Toggle minimap, expand/collapse descriptions, and manage your workspace effectively.", color: "text-teal-600 dark:text-teal-400" },
              ].map(feature => (
                <div key={feature.title} className="flex flex-col items-center text-center p-6 bg-card rounded-xl shadow-lg hover:shadow-primary/10 dark:hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02]">
                  <feature.icon className={`h-10 w-10 mb-4 ${feature.color}`} strokeWidth={1.5}/>
                  <h3 className="text-xl font-semibold mb-2 text-card-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section id="tech-stack" className="w-full py-16 md:py-24 lg:py-32 bg-background/70 dark:bg-background/50">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12 lg:mb-16">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-primary font-medium">
                Who Can Use StratPave?
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">
                Diverse Use Cases, Broad Value
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                StratPave empowers individuals and teams across various domains to visualize, plan, and execute their projects with clarity and efficiency.
              </p>
            </div>
            <div className="mx-auto grid max-w-4xl grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 text-center">
              {[
                "Software Developers", "Project Managers", "Students & Researchers", "Entrepreneurs", "Consultants",
                "Marketers", "Event Planners", "Educators", "Product Teams", "Designers", "Writers"
              ].map((tech) => (
                <div key={tech} className="flex flex-col items-center justify-center p-4 bg-card rounded-lg shadow-md hover:shadow-blue-400/20 dark:hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105 border border-border/50">
                  <Code className="h-7 w-7 mb-2 text-muted-foreground" strokeWidth={1.5}/>
                  <span className="text-xs sm:text-sm font-medium text-foreground/90">{tech}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 md:px-8 border-t border-border/30 bg-background/80 dark:bg-background/70">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
          <div className="flex items-center space-x-2">
            <Image
              src="/logos/Symbol_Logo_TransparentBG.png"
              alt="StratPave Icon"
              width={24}
              height={24}
              className="h-6 w-auto"
            />
            <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
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
