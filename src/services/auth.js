/**
 * Firebase Auth service — signup, login, Google login, logout.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// Google Auth provider instance
const googleProvider = new GoogleAuthProvider();

/**
 * Sign up a new user with email and password.
 */
export async function signup(email, password, displayName = "") {
  try {
    if (!auth) {
      const mockUser = {
        uid: "demo-" + Date.now(),
        email,
        displayName: displayName || email.split("@")[0],
      };
      console.log("[Demo] User signed up:", mockUser);
      return mockUser;
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    if (displayName) {
      await updateProfile(user, { displayName });
    }

    if (db) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          displayName: displayName || user.email.split("@")[0],
          role: "emt",
          createdAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("Could not create user document:", e.message);
      }
    }

    return user;
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
}

/**
 * Log in with email and password.
 */
export async function login(email, password) {
  try {
    if (!auth) {
      const mockUser = {
        uid: "demo-" + Date.now(),
        email,
        displayName: email.split("@")[0],
      };
      console.log("[Demo] User logged in:", mockUser);
      return mockUser;
    }

    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

/**
 * Log in with Google OAuth popup.
 */
export async function loginWithGoogle() {
  try {
    if (!auth) {
      const mockUser = {
        uid: "demo-google-" + Date.now(),
        email: "emt@gmail.com",
        displayName: "Google EMT",
      };
      console.log("[Demo] Google login:", mockUser);
      return mockUser;
    }

    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    if (db) {
      try {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          displayName: user.displayName || user.email.split("@")[0],
          photoURL: user.photoURL || "",
          role: "emt",
          lastLogin: new Date().toISOString(),
        }, { merge: true });
      } catch (e) {
        console.warn("Could not update user document:", e.message);
      }
    }

    return user;
  } catch (error) {
    console.error("Google login error:", error);
    throw error;
  }
}

/**
 * Log out the current user.
 */
export async function logout() {
  try {
    sessionStorage.removeItem("gh_demo_user");

    if (!auth) {
      console.log("[Demo] User logged out");
      return;
    }
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthChange(callback) {
  if (!auth) {
    const demoUser = sessionStorage.getItem("gh_demo_user");
    callback(demoUser ? JSON.parse(demoUser) : null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
