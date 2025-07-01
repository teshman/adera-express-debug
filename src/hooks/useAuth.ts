
// =============================================================================
// 3. Auth Hook (src/hooks/useAuth.ts content)
// =============================================================================

import { useEffect, useState } from "react";
import { subscribeToAuthChanges } from "../services/AuthService";
import { User as FirebaseUser } from 'firebase/auth';
// No need to import subscribeToAuthChanges again

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
}

export const useAuth = (): AuthState => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true, // Start in loading state
  });

  useEffect(() => {
    // Subscribe to Firebase Auth state changes
    const unsubscribe = subscribeToAuthChanges((user) => {
      setAuthState({ user, loading: false }); // Update state and set loading to false
    });

    // Clean up the subscription when the component unmounts
    return () => unsubscribe();
  }, []);

  return authState;
};
