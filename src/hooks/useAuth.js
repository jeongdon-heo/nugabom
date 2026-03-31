import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut as fbSignOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      // Popup blocked on mobile — fallback to redirect
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-closed-by-user') {
        await signInWithRedirect(auth, googleProvider);
      } else {
        throw e;
      }
    }
  }, []);

  const signOut = useCallback(() => fbSignOut(auth), []);

  return { user, loading, signIn, signOut };
}
