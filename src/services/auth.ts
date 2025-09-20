import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, MOCK_MODE } from '../config/firebase';
import { User } from '../types';

// Mock authentication service (fallback)
class MockAuthService {
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    // Load user from localStorage on initialization
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
        console.log('MockAuthService: Loaded user from localStorage:', this.currentUser);
      } catch (error) {
        console.error('MockAuthService: Error parsing stored user:', error);
        localStorage.removeItem('mockUser');
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async signIn(_email: string, _password: string): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user: User = {
      id: 'mock-user-id',
      name: _email.split('@')[0],
      email: _email,
      role: _email.includes('moderator') ? 'moderator' : 'user',
      createdAt: new Date().toISOString()
    };

    this.currentUser = user;
    localStorage.setItem('mockUser', JSON.stringify(user));
    console.log('MockAuthService: User signed in and stored:', user);
    this.notifyListeners();

    return user;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async signUp(_name: string, _email: string, _password: string): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user: User = {
      id: 'mock-user-' + Date.now(),
      name: _name,
      email: _email,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    this.currentUser = user;
    localStorage.setItem('mockUser', JSON.stringify(user));
    console.log('MockAuthService: User signed up and stored:', user);
    this.notifyListeners();

    return user;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem('mockUser');
    console.log('MockAuthService: User signed out');
    this.notifyListeners();
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    // Call immediately with current state
    callback(this.currentUser);
    
    // Add to listeners
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentUser);
      } catch (error) {
        console.error('MockAuthService: Error notifying listener:', error);
      }
    });
  }

  async signInWithGoogle(): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user: User = {
      id: 'google-user-id',
      name: 'Google User',
      email: 'google@example.com',
      role: 'user',
      createdAt: new Date().toISOString()
    };
    
    this.currentUser = user;
    localStorage.setItem('mockUser', JSON.stringify(user));
    console.log('MockAuthService: User signed in with Google and stored:', user);
    this.notifyListeners();
    
    return user;
  }
}// Firebase authentication service
class FirebaseAuthService {

  async signIn(email: string, password: string): Promise<User> {
    try {
      console.log('Attempting Firebase email sign-in for:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Firebase email sign-in successful');
      return this.firebaseUserToUser(result.user);
    } catch (error) {
      console.error('Firebase sign in error:', error);
      throw error;
    }
  }

  async signUp(name: string, email: string, password: string): Promise<User> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update the display name
      await updateProfile(result.user, { displayName: name });

      // Create user document in Firestore
      const moderatorEmail = import.meta.env.VITE_MODERATOR_EMAIL;
      const isModerator = email === moderatorEmail;

      const userData: User = {
        id: result.user.uid,
        name,
        email,
        role: isModerator ? 'moderator' : 'user',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', result.user.uid), userData);

      return userData;
    } catch (error) {
      console.error('Firebase sign up error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Firebase sign out error:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    if (!auth.currentUser) return null;
    return this.firebaseUserToUser(auth.currentUser);
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    console.log('Setting up Firebase auth state listener...');
    const unsubscribe = firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('Firebase user detected:', firebaseUser.email);
        // Get additional user data from Firestore
        try {
          console.log('Fetching user document from Firestore...');
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            // Override role if user is moderator based on email
            const moderatorEmail = import.meta.env.VITE_MODERATOR_EMAIL;
            if (firebaseUser.email === moderatorEmail) {
              userData.role = 'moderator';
            }
            console.log('User document found in Firestore');
            callback(userData);
          } else {
            console.log('User document not found in Firestore, using Firebase Auth data');
            // Fallback to basic Firebase user data
            callback(this.firebaseUserToUser(firebaseUser));
          }
        } catch (firestoreError) {
          console.error('Firestore error in onAuthStateChanged:', firestoreError);
          console.log('Falling back to Firebase Auth data due to Firestore error');
          // If Firestore fails, return basic Firebase user data
          callback(this.firebaseUserToUser(firebaseUser));
        }
      } else {
        console.log('No Firebase user detected');
        callback(null);
      }
    });

    return unsubscribe;
  }

  async signInWithGoogle(): Promise<User> {
    try {
      console.log('Starting Google sign-in...');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign-in successful:', result.user.email);

      // Check if user document exists, if not create it
      try {
        console.log('Checking Firestore for user document...');
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));

        if (!userDoc.exists()) {
          console.log('Creating new user document in Firestore...');
          // Create user document for new Google users
          const moderatorEmail = import.meta.env.VITE_MODERATOR_EMAIL;
          const isModerator = result.user.email === moderatorEmail;

          const userData: User = {
            id: result.user.uid,
            name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
            email: result.user.email || '',
            role: isModerator ? 'moderator' : 'user',
            createdAt: new Date().toISOString()
          };

          await setDoc(doc(db, 'users', result.user.uid), userData);
          console.log('User document created successfully');
          return userData;
        } else {
          console.log('User document found, returning existing data');
          // Return existing user data
          return userDoc.data() as User;
        }
      } catch (firestoreError) {
        console.error('Firestore error:', firestoreError);
        console.log('Falling back to Firebase Auth user data...');
        // If Firestore fails, return basic user data from Firebase Auth
        const moderatorEmail = import.meta.env.VITE_MODERATOR_EMAIL;
        const isModerator = result.user.email === moderatorEmail;

        return {
          id: result.user.uid,
          name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
          email: result.user.email || '',
          role: isModerator ? 'moderator' : 'user',
          createdAt: result.user.metadata.creationTime || new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Firebase Google sign in error:', error);
      throw error;
    }
  }

  private firebaseUserToUser(firebaseUser: FirebaseUser): User {
    const moderatorEmail = import.meta.env.VITE_MODERATOR_EMAIL;
    const isModerator = firebaseUser.email === moderatorEmail;

    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      email: firebaseUser.email || '',
      role: isModerator ? 'moderator' : 'user',
      createdAt: firebaseUser.metadata.creationTime || new Date().toISOString()
    };
  }
}

// Use Firebase service if configured, otherwise use mock service
export const authService = MOCK_MODE ? new MockAuthService() : new FirebaseAuthService();

// Debug logging
console.log('Auth Service:', MOCK_MODE ? 'MockAuthService' : 'FirebaseAuthService');