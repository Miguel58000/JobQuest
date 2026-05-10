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

  readonly isAuthenticated = signal(false);
  readonly currentUser = computed(() => this.currentUserSignal());

  constructor() {
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
    });
  }

  async register(email: string, password: string, name?: string): Promise<void> {
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
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  getCurrentUser(): User | null {
    return this.currentUserSignal();
  }

  token(): string | null {
    return this.tokenSignal();
  }
}