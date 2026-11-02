import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  auth, 
  db, 
  isFirebaseConfigured, 
  firebaseInitializationError,
  googleProvider,
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  doc, setDoc, getDoc
} from '../services/firebase';
import { demoStorage } from '../services/demoData';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState('idle');
  const [profileError, setProfileError] = useState('');
  const activeUidRef = useRef(null);
  const activeFetchUidRef = useRef(null);
  const profileFetchVersionRef = useRef(0);
  const profileReadyUidRef = useRef(null);

  const getLocalProfileForUser = (uid, email, preferredName = '') => {
    const saved = demoStorage.getProfile(uid);
    const ownSavedProfile = saved?.uid === uid ? saved : {};
    return {
      uid,
      name: preferredName || ownSavedProfile.name || email?.split('@')[0] || 'User',
      email: email || ownSavedProfile.email || '',
      college: ownSavedProfile.college || '',
      degree: ownSavedProfile.degree || '',
      gradYear: ownSavedProfile.gradYear || '2026',
      targetRole: ownSavedProfile.targetRole || 'Software Engineer',
      skills: ownSavedProfile.skills || 'Python, JavaScript, React',
      experienceLevel: ownSavedProfile.experienceLevel || 'Entry Level / Student',
      ...ownSavedProfile
    };
  };

  const describeProfileError = (error) => {
    if (error?.code === 'permission-denied') {
      return "Firestore denied access to this profile. Check the user's sign-in state and the /users/{uid} security rule.";
    }
    if (
      error?.code === 'unavailable' ||
      error?.code === 'failed-precondition' ||
      error?.message?.includes('offline') ||
      error?.message?.includes('unreachable') ||
      error?.message?.includes('timed out') ||
      error?.message?.includes('Cloud Firestore API')
    ) {
      return 'Firestore is offline or unreachable. The profile shown is a local copy and may be out of date.';
    }
    return `Firestore profile request failed${error?.code ? ` (${error.code})` : ''}. The profile shown is a local copy and may be out of date.`;
  };

  const fetchProfile = async (uid, email, preferredName = '') => {
    if (!uid || activeUidRef.current !== uid) return null;

    // Prevent duplicate concurrent fetches for the same user
    if (activeFetchUidRef.current === uid) {
      return userProfile;
    }
    activeFetchUidRef.current = uid;
    const fetchVersion = ++profileFetchVersionRef.current;
    const isCurrentFetch = () => (
      activeUidRef.current === uid && profileFetchVersionRef.current === fetchVersion
    );

    setProfileStatus('loading');
    setProfileError('');

    if (!isFirebaseConfigured || !db) {
      const message = firebaseInitializationError
        ? `Firebase initialization failed: ${firebaseInitializationError}`
        : 'Firebase Firestore is not configured. This profile is stored only on this device.';
      const localProfile = getLocalProfileForUser(uid, email, preferredName);
      if (isCurrentFetch()) {
        setProfileError(message);
        setProfileStatus('fallback');
        setUserProfile(localProfile);
        profileReadyUidRef.current = uid;
        activeFetchUidRef.current = null;
      }
      return localProfile;
    }

    try {
      const userDocRef = doc(db, 'users', uid);
      
      // Enforce timeout so an offline or disabled Firestore does not hang indefinitely
      const docSnap = await Promise.race([
        getDoc(userDocRef),
        new Promise((_, reject) =>
          setTimeout(() => {
            const err = new Error('Firestore connection timed out.');
            err.code = 'unavailable';
            reject(err);
          }, 6000)
        )
      ]);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const profile = {
          ...data,
          uid,
          email: email || data.email || '',
          name: data.name || preferredName || email?.split('@')[0] || 'User'
        };
        if (isCurrentFetch()) {
          setUserProfile(profile);
          demoStorage.saveProfile(uid, profile);
          setProfileStatus('loaded');
          setProfileError('');
          profileReadyUidRef.current = uid;
          activeFetchUidRef.current = null;
        }
        return profile;
      }

      // Step 4: If the profile does not exist, create it safely with appropriate default values.
      // This only triggers when docSnap does NOT exist, preserving existing profile data.
      const initialProfile = {
        uid,
        name: preferredName || email?.split('@')[0] || 'User',
        email: email || '',
        college: '',
        degree: '',
        gradYear: '2026',
        targetRole: 'Software Engineer',
        skills: 'Python, JavaScript, React',
        experienceLevel: 'Entry Level / Student',
        createdAt: new Date().toISOString()
      };

      try {
        await Promise.race([
          setDoc(userDocRef, initialProfile),
          new Promise((_, reject) =>
            setTimeout(() => {
              const err = new Error('Firestore write timed out.');
              err.code = 'unavailable';
              reject(err);
            }, 6000)
          )
        ]);
        if (isCurrentFetch()) {
          setUserProfile(initialProfile);
          demoStorage.saveProfile(uid, initialProfile);
          setProfileStatus('loaded');
          setProfileError('');
          profileReadyUidRef.current = uid;
          activeFetchUidRef.current = null;
        }
        return initialProfile;
      } catch (createErr) {
        console.warn(`Firestore profile creation failed (${createErr?.code || 'unknown'}):`, createErr);
        if (isCurrentFetch()) {
          setUserProfile(initialProfile);
          demoStorage.saveProfile(uid, initialProfile);
          setProfileStatus('fallback');
          setProfileError(describeProfileError(createErr));
          profileReadyUidRef.current = uid;
          activeFetchUidRef.current = null;
        }
        return initialProfile;
      }
    } catch (err) {
      const message = describeProfileError(err);
      console.warn(`Firestore profile fetch failed (${err?.code || 'unknown'}):`, err);
      const localProfile = getLocalProfileForUser(uid, email, preferredName);
      if (isCurrentFetch()) {
        setUserProfile(localProfile);
        setProfileStatus('fallback');
        setProfileError(message);
        profileReadyUidRef.current = uid;
        activeFetchUidRef.current = null;
      }
      return localProfile;
    }
  };

  const beginUserSession = (user) => {
    if (activeUidRef.current === user.uid) {
      setCurrentUser(user);
      return;
    }
    profileFetchVersionRef.current += 1;
    activeFetchUidRef.current = null;
    profileReadyUidRef.current = null;
    activeUidRef.current = user.uid;
    setCurrentUser(user);
    setUserProfile(null);
    setProfileStatus('loading');
    setProfileError('');
    setAuthLoading(true);
  };

  useEffect(() => {
    let isMounted = true;

    // If Firebase is not configured or auth not initialized
    if (!isFirebaseConfigured || !auth) {
      activeUidRef.current = null;
      setCurrentUser(null);
      setUserProfile(null);
      setProfileStatus('idle');
      setProfileError(firebaseInitializationError || '');
      setAuthLoading(false);
      return undefined;
    }

    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          if (!isMounted) return;
          if (user) {
            if (activeUidRef.current !== user.uid) {
              beginUserSession(user);
            } else {
              setCurrentUser(user);
            }
            try {
              if (profileReadyUidRef.current !== user.uid) {
                await fetchProfile(user.uid, user.email, user.displayName || '');
              }
            } catch (err) {
              console.warn("Firebase profile sync warning:", err);
            } finally {
              if (activeUidRef.current === user.uid) setAuthLoading(false);
            }
          } else {
            profileFetchVersionRef.current += 1;
            activeUidRef.current = null;
            activeFetchUidRef.current = null;
            profileReadyUidRef.current = null;
            setCurrentUser(null);
            setUserProfile(null);
            setProfileStatus('idle');
            setProfileError('');
            setAuthLoading(false);
          }
        },
        (error) => {
          console.warn("Firebase onAuthStateChanged error:", error);
          if (!isMounted) return;
          profileFetchVersionRef.current += 1;
          activeUidRef.current = null;
          activeFetchUidRef.current = null;
          profileReadyUidRef.current = null;
          setCurrentUser(null);
          setUserProfile(null);
          setProfileStatus('idle');
          setProfileError(`Firebase authentication state failed${error?.code ? ` (${error.code})` : ''}.`);
          setAuthLoading(false);
        }
      );

      return () => {
        isMounted = false;
        if (unsubscribe) unsubscribe();
      };
    } catch (e) {
      console.warn("Firebase auth listener failed to attach:", e);
      activeUidRef.current = null;
      activeFetchUidRef.current = null;
      profileReadyUidRef.current = null;
      setCurrentUser(null);
      setUserProfile(null);
      setProfileStatus('idle');
      setProfileError(e instanceof Error ? e.message : 'Firebase auth listener failed to attach.');
      setAuthLoading(false);
    }
  }, []);

  // Signup
  const signup = async (email, password, name) => {
    if (!isFirebaseConfigured || !auth) {
      const error = new Error('Firebase authentication is not configured. Add your Firebase credentials and enable Email/Password sign-in in the Firebase Console.');
      error.code = 'auth/configuration-not-found';
      throw error;
    }

    const res = await createUserWithEmailAndPassword(auth, email, password);
    const initialProfile = {
      uid: res.user.uid,
      name: name || email.split('@')[0],
      email: email,
      college: '',
      degree: '',
      gradYear: '2026',
      targetRole: 'Software Engineer',
      skills: 'Python, JavaScript, React',
      experienceLevel: 'Entry Level / Student',
      createdAt: new Date().toISOString()
    };

    beginUserSession(res.user);
    profileFetchVersionRef.current += 1;
    activeFetchUidRef.current = null;
    setUserProfile(initialProfile);
    profileReadyUidRef.current = res.user.uid;
    demoStorage.saveProfile(res.user.uid, initialProfile);

    if (db) {
      setProfileStatus('saving');
      try {
        await Promise.race([
          setDoc(doc(db, 'users', res.user.uid), initialProfile),
          new Promise((_, reject) => setTimeout(() => {
            const err = new Error('Firestore write timed out.');
            err.code = 'unavailable';
            reject(err);
          }, 6000))
        ]);
        setProfileStatus('loaded');
        setProfileError('');
      } catch (e) {
        console.warn(`Firestore user creation failed (${e?.code || 'unknown'}):`, e);
        setProfileStatus('fallback');
        setProfileError(describeProfileError(e));
      }
    } else {
      setProfileStatus('fallback');
      setProfileError('Firestore is not initialized. This profile is stored only on this device.');
    }
    setAuthLoading(false);

    return res.user;
  };

  // Login
  const login = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      const error = new Error('Firebase authentication is not configured. Add your Firebase credentials and enable Email/Password sign-in in the Firebase Console.');
      error.code = 'auth/configuration-not-found';
      throw error;
    }

    const res = await signInWithEmailAndPassword(auth, email, password);
    beginUserSession(res.user);
    return res.user;
  };

  // Google Login
  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      const error = new Error('Google sign-in is not configured. Add your Firebase credentials and enable Google sign-in in the Firebase Console.');
      error.code = 'auth/configuration-not-found';
      throw error;
    }

    const res = await signInWithPopup(auth, googleProvider);
    beginUserSession(res.user);
    return res.user;
  };

  // Password reset
  const resetPassword = async (email) => {
    if (!isFirebaseConfigured || !auth) {
      const error = new Error('Firebase authentication is not configured. Add your Firebase credentials and enable Email/Password sign-in in the Firebase Console.');
      error.code = 'auth/configuration-not-found';
      throw error;
    }

    return await sendPasswordResetEmail(auth, email);
  };

  // Logout
  const logout = async () => {
    profileFetchVersionRef.current += 1;
    activeUidRef.current = null;
    activeFetchUidRef.current = null;
    profileReadyUidRef.current = null;
    setCurrentUser(null);
    setUserProfile(null);
    setProfileStatus('idle');
    setProfileError('');
    setAuthLoading(false);

    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn("Signout error:", e);
      }
    }
  };

  // Update Profile
  const updateProfileData = async (newProfileData) => {
    const updated = { ...userProfile, ...newProfileData };
    setUserProfile(updated);

    let syncedToFirestore = false;
    let syncError = '';
    if (isFirebaseConfigured && db && currentUser) {
      setProfileStatus('saving');
      try {
        await Promise.race([
          setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true }),
          new Promise((_, reject) => setTimeout(() => {
            const err = new Error('Firestore save timed out.');
            err.code = 'unavailable';
            reject(err);
          }, 6000))
        ]);
        syncedToFirestore = true;
        setProfileStatus('loaded');
        setProfileError('');
      } catch (err) {
        console.warn(`Firestore profile save failed (${err?.code || 'unknown'}); saving locally:`, err);
        setProfileStatus('fallback');
        syncError = describeProfileError(err);
        setProfileError(syncError);
      }
    } else {
      setProfileStatus('fallback');
      syncError = 'Firestore is not initialized. Profile changes are stored only on this device.';
      setProfileError(syncError);
    }
    if (currentUser?.uid) demoStorage.saveProfile(currentUser.uid, updated);
    return { profile: updated, syncedToFirestore, syncError };
  };

  const value = {
    currentUser,
    userProfile,
    loading: authLoading, // backward compatible
    authLoading,
    profileLoading: profileStatus === 'loading',
    profileStatus,
    profileError,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateProfileData,
    fetchProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
