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
import { Loader2, LogOut, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuthModal } from '@/stores/useAuthModal'; // 👈 NEW

export function UserAuthSection() {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();

  const { isOpen, activeTab, openModal, closeModal } = useAuthModal(); // 👈 NEW

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "Could not log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-5 w-5 animate-spin" />
      </Button>
    );
  }

  if (!user) {
    return (
      <>
        <Button onClick={() => openModal("login")} variant="outline">
          Login
        </Button>
        <Button onClick={() => openModal("signup")} className="ml-2">
          Sign Up
        </Button>
        <Dialog open={isOpen} onOpenChange={closeModal}>
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
            <Tabs value={activeTab} onValueChange={(val) => openModal(val as 'login' | 'signup')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="pt-4">
                <LoginForm
                  onSwitchToSignUp={() => openModal("signup")}
                  onLoginSuccess={closeModal}
                />
              </TabsContent>
              <TabsContent value="signup" className="pt-4">
                <SignUpForm
                  onSwitchToLogin={() => openModal("login")}
                  onSignUpSuccess={closeModal}
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
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            <p className="text-xs leading-none text-muted-foreground">UserID: {user.uid}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
