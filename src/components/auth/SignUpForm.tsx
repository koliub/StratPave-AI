// src/components/auth/SignUpForm.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext'; // Import the auth hook
import { Loader2 } from 'lucide-react'; // Assuming you have lucide-react

interface SignUpFormProps {
  onSwitchToLogin: () => void; // Function to switch to the login tab
  onSignUpSuccess: () => void;  // Function to call on successful signup
}

export function SignUpForm({ onSwitchToLogin, onSignUpSuccess }: SignUpFormProps) {
  const { signUp, loading: authLoading } = useAuth(); // Get the signUp function and auth loading state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Local loading state for the form submission

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setLoading(true); // Start local loading

    try {
      // Call the signUp function from the Auth Context
      await signUp(email, password);
      // If signUp completes without throwing an error, it was successful
      onSignUpSuccess(); // Call the success callback
      // The AuthContext listener will update the user state globally
      // You might want to show a success toast here or in the component calling this form
    } catch (err: any) {
       // Handle specific Firebase auth errors (e.g., email-already-in-use, weak-password)
      console.error("Sign Up error:", err.message);
      setError(err.message || "An unexpected error occurred during sign up."); // Display error message
    } finally {
      setLoading(false); // Stop local loading
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {error && <p className="text-sm font-medium text-destructive">{error}</p>} {/* Display error */}
      <div className="grid gap-2">
        <Label htmlFor="email-signup">Email</Label>
        <Input
          id="email-signup" // Use a unique ID
          type="email"
          placeholder="m@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password-signup">Password</Label>
        <Input
          id="password-signup" // Use a unique ID
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {/* Use local loading state or combined with authLoading if appropriate */}
       <Button type="submit" className="w-full" disabled={loading || authLoading}>
        {(loading || authLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign Up
      </Button>
      <Button type="button" variant="link" className="w-full" onClick={onSwitchToLogin}>
        Already have an account? Login
      </Button>
    </form>
  );
}
