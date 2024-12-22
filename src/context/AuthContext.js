import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (login, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = async (userData) => {
    try {
      setError(null);
      console.log('Starting registration with data:', { ...userData, password: '***' });

      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            birthDate: userData.birthDate,
          },
        }
      });

      console.log('Registration response:', { authData, error: signUpError });

      if (signUpError) throw signUpError;

      if (authData?.user) {
        console.log('Registration successful:', authData.user);
        
        // Check if email confirmation is required
        if (authData.session) {
          // User is immediately signed in - create family
          try {
            const { data: family, error: familyError } = await supabase
              .from('families')
              .insert([
                { 
                  name: `${userData.firstName}'s Family`,
                  created_by: authData.user.id 
                }
              ])
              .select()
              .single();

            if (familyError) {
              console.error('Family creation error:', familyError);
              throw familyError;
            }
            
            console.log('Family created:', family);
            return true;
          } catch (err) {
            console.error('Error creating family:', err);
            throw err;
          }
        } else {
          // Email confirmation required
          setError('Please check your email for confirmation link before logging in.');
          return true; // Return true to indicate successful registration but needs confirmation
        }
      }
      return false;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message);
      return false;
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error('Error signing out:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      error,
      login,
      register,
      logout
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}