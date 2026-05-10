import { Injectable, signal, computed } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

const app = initializeApp(environment.firebase);
const auth = getAuth(app);
const db = getFirestore(app);

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(null);
  private authInitPromise: Promise<void>;
  private isAuthInitialized = false;

  readonly isInitializing = signal(true);
  readonly isAuthenticated = signal(false);
  readonly currentUser = computed(() => this.currentUserSignal());

  constructor() {
    this.authInitPromise = new Promise((resolve) => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          this.tokenSignal.set(token);
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.exists() 
            ? { id: firebaseUser.uid, ...userDoc.data() } as User
            : { id: firebaseUser.uid, email: firebaseUser.email || '' };
          this.currentUserSignal.set(userData);
          this.isAuthenticated.set(true);
        } else {
          this.currentUserSignal.set(null);
          this.tokenSignal.set(null);
          this.isAuthenticated.set(false);
        }

        this.isInitializing.set(false);

        if (!this.isAuthInitialized) {
          this.isAuthInitialized = true;
          resolve();
        }
      });
    });
  }

  waitForAuth(): Promise<void> {
    return this.authInitPromise;
  }

  async register(email: string, password: string, name?: string): Promise<void> {
    this.isInitializing.set(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const displayName = name?.trim() || '';
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      await setDoc(doc(db, 'users', cred.user.uid), {
        email,
        name: displayName,
        createdAt: serverTimestamp()
      });
      this.currentUserSignal.set({ id: cred.user.uid, email, name: displayName } as User);
      this.isAuthenticated.set(true);
    } catch (error) {
      this.isInitializing.set(false);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<void> {
    this.isInitializing.set(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      this.currentUserSignal.set({ id: cred.user.uid, email: cred.user.email || '' } as User);
      this.isAuthenticated.set(true);
    } catch (error) {
      this.isInitializing.set(false);
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.isInitializing.set(true);
    await signOut(auth);
    this.currentUserSignal.set(null);
    this.isAuthenticated.set(false);
  }

  getCurrentUser(): User | null {
    return this.currentUserSignal();
  }

  token(): string | null {
    return this.tokenSignal();
  }
}