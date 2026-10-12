import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  isFirebaseConfigured, 
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
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(!isFirebaseConfigured);

  // Sync profile from Firestore or LocalStorage
  const fetchProfile = async (uid, email) => {
    if (isFirebaseConfigured && db) {
      try {
        const userDocRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data());
          return docSnap.data();
        }
      } catch (err) {
        console.warn("Firestore profile fetch failed, using fallback profile:", err);
      }
    }
    
    // Fallback to local profile
    const localProf = demoStorage.getProfile();
    const merged = { ...localProf, uid, email: email || localProf.email };
    setUserProfile(merged);
    return merged;
  };

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setCurrentUser(user);
          await fetchProfile(user.uid, user.email);
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // In Demo mode, auto log in default student user or restore session
      const savedUser = localStorage.getItem('skillix_demo_auth');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        fetchProfile(parsed.uid, parsed.email);
      } else {
        // Default demo active user
        const demoUser = { uid: 'demo_user_123', email: 'alex.morgan@university.edu', displayName: 'Alex Morgan' };
        setCurrentUser(demoUser);
        fetchProfile(demoUser.uid, demoUser.email);
        localStorage.setItem('skillix_demo_auth', JSON.stringify(demoUser));
      }
      setIsDemo(true);
      setLoading(false);
    }
  }, []);

  // Signup
  const signup = async (email, password, name) => {
    if (isFirebaseConfigured && auth) {
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
      if (db) {
        try {
          await setDoc(doc(db, 'users', res.user.uid), initialProfile);
        } catch (e) { console.error(e); }
      }
      setUserProfile(initialProfile);
      return res.user;
    } else {
      // Demo Signup
      const demoUser = { uid: `user_${Date.now()}`, email, displayName: name };
      const initialProfile = {
        uid: demoUser.uid,
        name: name || 'Student Developer',
        email: email,
        college: 'University Tech Institute',
        degree: 'B.S. Computer Science',
        gradYear: '2026',
        targetRole: 'Software Engineer',
        skills: 'Python, React, SQL',
        experienceLevel: 'Entry Level'
      };
      setCurrentUser(demoUser);
      setUserProfile(initialProfile);
      demoStorage.saveProfile(initialProfile);
      localStorage.setItem('skillix_demo_auth', JSON.stringify(demoUser));
      return demoUser;
    }
  };

  // Login
  const login = async (email, password) => {
    if (isFirebaseConfigured && auth) {
      const res = await signInWithEmailAndPassword(auth, email, password);
      await fetchProfile(res.user.uid, res.user.email);
      return res.user;
    } else {
      const demoUser = { uid: `user_${email.replace(/[^a-zA-Z0-9]/g, '')}`, email, displayName: email.split('@')[0] };
      setCurrentUser(demoUser);
      await fetchProfile(demoUser.uid, email);
      localStorage.setItem('skillix_demo_auth', JSON.stringify(demoUser));
      return demoUser;
    }
  };

  // Google Login
  const loginWithGoogle = async () => {
    if (isFirebaseConfigured && auth && googleProvider) {
      const res = await signInWithPopup(auth, googleProvider);
      await fetchProfile(res.user.uid, res.user.email);
      return res.user;
    } else {
      const googleUser = { uid: 'google_demo_user', email: 'student.google@university.edu', displayName: 'Google Student' };
      setCurrentUser(googleUser);
      await fetchProfile(googleUser.uid, googleUser.email);
      localStorage.setItem('skillix_demo_auth', JSON.stringify(googleUser));
      return googleUser;
    }
  };

  // Password reset
  const resetPassword = async (email) => {
    if (isFirebaseConfigured && auth) {
      return await sendPasswordResetEmail(auth, email);
    }
    return Promise.resolve();
  };

  // Logout
  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    localStorage.removeItem('skillix_demo_auth');
    setCurrentUser(null);
    setUserProfile(null);
  };

  // Update Profile
  const updateProfileData = async (newProfileData) => {
    const updated = { ...userProfile, ...newProfileData };
    setUserProfile(updated);

    if (isFirebaseConfigured && db && currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), updated, { merge: true });
      } catch (err) {
        console.warn("Firestore profile save failed, saving to local storage:", err);
      }
    }
    demoStorage.saveProfile(updated);
    return updated;
  };

  const value = {
    currentUser,
    userProfile,
    isDemo,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateProfileData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
