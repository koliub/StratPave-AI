
"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { Loader2, LogOut, UserCircle, Settings, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export function UserAuthSection() {
  const { user, loading, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) {
      toast({ title: "Logout Failed", description: "Could not log out. Please try again.", variant: "destructive" });
    }
  };

  if (loading) {
    return <Button variant="ghost" size="icon" disabled><Loader2 className="h-5 w-5 animate-spin" /></Button>;
  }

  if (!user) {
    return (
      <>
        <Button onClick={() => { setActiveTab("login"); setIsAuthModalOpen(true); }} variant="outline">
          Login
        </Button>
        <Button onClick={() => { setActiveTab("signup"); setIsAuthModalOpen(true); }} className="ml-2">
          Sign Up
        </Button>
        <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-center text-2xl font-semibold">
                {activeTab === "login" ? "Welcome Back!" : "Create Account"}
              </DialogTitle>
              <DialogDescription className="text-center">
                {activeTab === "login"
                  ? "Login to access your roadmaps."
                  : "Sign up to start creating and saving your roadmaps."}
              </DialogDescription>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="pt-4">
                <LoginForm 
                  onSwitchToSignUp={() => setActiveTab("signup")}
                  onLoginSuccess={() => setIsAuthModalOpen(false)}
                />
              </TabsContent>
              <TabsContent value="signup" className="pt-4">
                <SignUpForm 
                  onSwitchToLogin={() => setActiveTab("login")}
                  onSignUpSuccess={() => {
                    setIsAuthModalOpen(false);
                    // Potentially show another toast or redirect, handled by SignUpForm for now
                  }}
                />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // User is logged in
  const userDisplayName = user.displayName || user.email?.split('@')[0] || "User";
  const userInitials = userDisplayName.substring(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.photoURL || undefined} alt={userDisplayName} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userDisplayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        {/* Add more items like Profile, Settings here if needed */}
        {/* <DropdownMenuItem disabled>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem> */}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
