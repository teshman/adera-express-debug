import { inject, Injectable, NgZone } from '@angular/core';

import {
  Auth, createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, sendSignInLinkToEmail,
  signInWithEmailAndPassword, signInWithPopup, signInAnonymously,
  linkWithCredential, signOut, user, User,
  authState
} from '@angular/fire/auth';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, catchError, debounceTime, firstValueFrom, from, lastValueFrom, map, Observable, of, Subscription, switchMap, take, tap } from 'rxjs';
import { Firestore, Timestamp, collection, doc, getDoc, getDocs, onSnapshot, query, setDoc, updateDoc, where } from '@angular/fire/firestore'; // Add Firestore imports
import { NotificationService } from '../services/notification.service';

import { environment } from '../../../environments/environment';
import { ActionCodeSettings, applyActionCode, AuthCredential, browserLocalPersistence, browserSessionPersistence, EmailAuthProvider, getAuth, getIdTokenResult, IdTokenResult, inMemoryPersistence, reauthenticateWithCredential, sendEmailVerification, setPersistence, updateEmail, updatePassword, UserCredential } from 'firebase/auth';
import { FcmService } from '../firebase/fcm-service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CustomClaims, Roles } from '../models/role.model';
import { TaskMappingService } from '../../shared/services/task-mapping.service';
import { TaskService } from '../services/task.Service';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { PaymentTransactionService } from '../../shared/services/payment-transaction.service';
import { AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { UserRole } from '../../shared/interfaces/user';
import { UserProfile } from '../models/user-profile.model';
import { ShipmentRequest } from '../../shared/interfaces/shipment-request';
import { EmailService } from '../services/email.service';

interface UserContactInfo {
  id: string;
  email: string;
  phone?: string;
  name?: string;
}
interface UserData {
  email: string;
  uid: string;
  role: string; // e.g., 'admin', 'user', 'guest'
  signedInDate: string; // ISO string format (e.g., '2024-03-07T12:34:56.789Z')
}

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  public isLoggedIn = false;

  private apiUrl = environment.apiUrl; 
  private apiUrl2 =  ' https://us-central1-adera-melakia.cloudfunctions.net';
  private initialLoad = true; // Add initialLoad flag
  private currentUserEmail: any;
  private userRole!: UserRole;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
public currentUser$ = this.currentUserSubject.asObservable();

  public isAuthenticated$!: Observable<boolean>;
  private firestore = inject(Firestore); // Inject Firestore
  private auth = inject(Auth);
  public getAuth(): Auth {
    return this.auth;
  }
  private currentUserRolesSubject = new BehaviorSubject<string[] | null>(null);
  currentUserRoles$ = this.currentUserRolesSubject.asObservable();
  

  private isAnonymousSession = new BehaviorSubject<boolean>(false);
  isAnonymousSession$ = this.isAnonymousSession.asObservable();

  constructor(
  private router: Router, 
  private messagingService: FcmService,
  private emailService: EmailService,
  private ngZone: NgZone,
  private http: HttpClient, 
  private taskMapping: TaskMappingService,
  private snackBar: MatSnackBar, 
  private taskService: TaskService,
  private notificationService: NotificationService
) {
  this.setAuthPersistence('local');
  this.initializeUserState();
  this.setupAuthStateListener();
  // this.setupNavigationTracking();
  this.initializeUserObservables();
}



private initializeUserState() {
  // 1. Check localStorage
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    try {
      const userData: UserData = JSON.parse(storedUser);
      this.currentUserSubject.next({
        uid: userData.uid,
        email: userData.email
      } as User);
      this.userRole = userData.role as UserRole;
    } catch {
      this.clearStoredUser();
    }
  }

  // 2. Sync with Firebase Auth
 onAuthStateChanged(this.auth, (user) => {
    this.ngZone.run(() => {
      this.currentUserSubject.next(user);
      if (user) {
        localStorage.setItem('currentUser', JSON.stringify({
          uid: user.uid,
          email: user.email,
          role: this.userRole
        }));
      } else {
        this.clearStoredUser();
      }
    });
  });
}


private clearStoredUser() {
  localStorage.removeItem('currentUser');
  this.currentUserSubject.next(null);
}

private setupAuthStateListener() {
  onAuthStateChanged(this.auth, async (user) => {
    this.ngZone.run(() => this.handleAuthStateChange(user));
  });
}

private async handleAuthStateChange(user: User | null) {
  this.currentUserSubject.next(user);
  console.log("Auth state changed:", user?.uid || 'Logged out');

  if (user) {
    await this.handleAuthenticatedUser(user);
  } else {
    this.handleUnauthenticatedUser();
  }
}

private async handleAuthenticatedUser(user: User) {
  this.currentUserEmail = user.email || '';
  
  // Token validation should move to server
  const isValidToken = await this.validateAuthToken(user);
  if (!isValidToken) return;

  // Email verification flow
  if (!user.emailVerified) {
    this.router.navigate(['/verify-email']);
    return;
  }

  // This Firestore access should move to server
  await this.loadUserRoles(user.uid);
}



async loadUserRoles(userId: string): Promise<string[]> {
    try {
        const roles = await this.http.get<string[]>(
  `${this.apiUrl}/user/${userId}/roles`,
  { 
    headers: { 
      Authorization: `Bearer ${await this.getCurrentToken()}` 
    } 
  }
).toPromise();

        return roles || [];

    } catch (error:any) {
        console.error('Failed to load user roles:', error);
        throw new Error(
            error.error?.error || 
            'Failed to load user roles'
        );
    }
}

private async getCurrentToken(): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    return user.getIdToken();
}

private initializeUserObservables() {
  // Current user observable
  this.currentUser$ = new Observable<User | null>(observer => {
    return onAuthStateChanged(this.auth, user => {
      observer.next(user);
      this.isAnonymousSession.next(user?.isAnonymous || false);
      localStorage.setItem('wasAnonymous', String(user?.isAnonymous || false));
    });
  });

  // Authentication state
this.isAuthenticated$ = this.currentUser$.pipe(
  map(user => Boolean(user)) // Explicit conversion
  // Alternative syntax: map(user => !!user)
);
}
















private handleUnauthenticatedUser() {
  if (this.initialLoad) {
    this.initialLoad = false;
    return;
  }
  this.router.navigate(['/home']);
}

private async validateAuthToken(user: User): Promise<boolean> {
    try {
        const token = await user.getIdToken(true);
       console.log('Current Firebase token:', token); // Verify token exists

        const response = await this.http.post<{
        valid: boolean;
        error?: string;
      }>(`${this.apiUrl}/auth/validate-token`, { token }).toPromise(); // <-- Corrected line

        if (!response?.valid) {
            await this.auth.signOut();
            this.router.navigate(['/home']);
            return false;
        }
        return true;

    } catch (error) {
        console.error('Token validation error:', error);
        await this.auth.signOut();
        this.router.navigate(['/home']);
        return false;
    }
}













  
  //OK
  hasRole(role: string): Observable<boolean> {
    return this.currentUserRoles$.pipe(
      tap(roles => console.log('Raw roles from Firestore:', roles)), // Debug 1
      map(roles => {
        const hasRole = roles?.includes(role) || false;
        console.log(`Does user have ${role}?`, hasRole); // Debug 2
        return hasRole;
      })
    );
  }



//[ok]
  private async checkAndRestoreAnonymousSession(): Promise<void> {
    const wasAnonymous = localStorage.getItem('wasAnonymous');
    if (!await this.auth.currentUser && wasAnonymous === 'true') {
      try {
        const result = await signInAnonymously(this.auth);
        console.log('Anonymous session restored:', result.user);
        // Update currentUser$ as authState might not emit immediately
        this.currentUser$ = of(result.user);
        this.isAnonymousSession.next(true);
      } catch (error) {
        console.error('Failed to restore anonymous session:', error);
        localStorage.removeItem('wasAnonymous');
      }
    } else if (await this.auth.currentUser?.isAnonymous) {
      this.isAnonymousSession.next(true);
      localStorage.setItem('wasAnonymous', 'true');
    } else {
      this.isAnonymousSession.next(false);
      
      localStorage.removeItem('wasAnonymous');
    }
  }

  // Sign in with Google [ok]
  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
    this.messagingService.requestPermission().then((user: any) => {
      if (user) {
        this.notificationService.createSystemNotification({
          userId: this.getCurrentUserId(), // Must now provide
          title: 'Login Success',
          message: 'User have been signed in successfully', // Required but can be empty
          metadata: {}
        });


        this.router.navigate(['/home']); // Navigate to dashboard on login
      }
    });
  }

// [ok]
  async signInAnonymously(shipmentRequest: ShipmentRequest): Promise<User | null> {
    try {
      const result = await signInAnonymously(this.auth);
      localStorage.setItem('wasAnonymous', 'true');

          this.saveUserDataToLocalStorage(shipmentRequest.requesterEmail!, result.user);
      this.isAnonymousSession.next(true);
      // Update currentUser$
      this.currentUser$ = of(result.user);
      await this.setAnonymousUserInFirestore(result.user, shipmentRequest.requesterEmail! );
      return result.user;
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      return null;
    }
  }

//code refactored
 async setAnonymousUserInFirestore(user: User | null, requesterEmail: string): Promise<void> {
    if (!user) return;

    try {
      const response = await this.http.post(`${this.apiUrl}/users/anonymous`, {
        uid: user.uid,
        email: requesterEmail
      }).toPromise();

      console.log('Anonymous user created via API:', response);
    } catch (error) {
      console.error('Failed to create anonymous user:', error);
      throw error;
    }
  }

  //OK
  async createSignInLink(email: string, deliveryId: string): Promise<string> {
    const actionCodeSettings = {
      url: `${window.location.origin}/link-sign-in?deliveryId=${deliveryId}`,
      handleCodeInApp: true,
    };
    try {
      await sendSignInLinkToEmail(this.auth, email, actionCodeSettings);
      localStorage.setItem('emailForSignIn', email); // Save email for confirmation later
      return 'Sign-in link sent to your email!'; // Or a more informative message
    } catch (error: any) {
      console.error('Error sending sign-in link:', error);
      return `Error sending sign-in link: ${error.message}`;
    }
  }

//ok
  async setCustomClaims(uid: string, roles: string[]) {
    console.log('Client: setCustomClaims called with uid:', uid, 'roles:', roles); // Debug

    try {
      // Call a backend function to set custom claims
      const response = await  this.http.post(`${this.apiUrl}/set-custom-claims`, { uid, roles }).toPromise();
      console.log('Client: Custom claims set successfully. Response:', response); // Debug

    } catch (error) {
      console.error('Error setting custom claims:', error);
      throw error;
    }
  }

  // Save user data to Firestore
  // Refactored
  async saveUserData(uid: string, data: any): Promise<void> {
    try {
      const response = await this.http.post(`${this.apiUrl}/save`, {
        uid,
        data
      }).toPromise();

      console.log('User data saved via API:', response);
    } catch (error) {
      console.error('Failed to save user data:', error);
      throw this.handleSaveError(error);
    }
  }

//OK
   private handleSaveError(error: any): Error {
    if (error?.error?.error) {
      return new Error(error.error.error);
    }
    return new Error('Failed to save user data');
  }

  //OK
  async checkIfUserIsAuthenticated(): Promise<boolean> {
    return !!(await this.auth.currentUser);
  }

  // Fetch user data from Firestore

//Refactored
  async getUserData(uid: string): Promise<any> {
    try {
      const response = await this.http.get<{
        success: boolean;
        data: UserData;
      }>(`${this.apiUrl}/${uid}`).toPromise();

      return response?.data || null;
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      return null;
    }
  }

//ok
 private userCache = new Map<string, UserData>();

 //OK
  async getUserDataWithCache(uid: string): Promise<UserData | null> {
    if (this.userCache.has(uid)) {
      return this.userCache.get(uid) || null;
    }

    const userData = await this.getUserData(uid);
    if (userData) {
      this.userCache.set(uid, userData);
    }
    return userData;
  }

//OK
  getCurrentUserId(): string {
    try {
      const user = this.auth.currentUser; // Get the current user from Firebase Auth
      if (!user) {
        console.warn('No user is currently signed in.');
        return ''; // Return null if no user is signed in
      }
      return user.uid; // Return the user's UID
    } catch (error) {
      console.error('Error fetching current user ID:', error);
      throw error; // Re-throw the error for handling in the calling code
    }
  }

  

  // Log in with email/password
  // [ok]
async logIn(email: string, password: string): Promise<UserCredential> {
  try {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    console.log('user credential: ', userCredential);
    // AuthStateChanged listener will automatically:
    // 1. Update currentUserSubject
    // 2. Update localStorage
    // 3. Handle userRole
    
    // Optional: Request notifications
    this.messagingService.requestPermission().then(() => {
      this.notificationService.createSystemNotification({
        userId: userCredential.user.uid,
        title: 'Login Success',
        message: 'Welcome back!',
        metadata: {}
      });
    });

    return userCredential;
    
  } catch (error) {
    this.snackBar.open('Login failed. Please try again.', 'Close', { 
      duration: 3000 
    });
    throw error;
  }
}

  //Refactored
async logout(): Promise<void> {
    let userId: string | undefined;
    
    try {
      userId = this.getCurrentUserId();
      
      console.log('awaiting api/post...');
      // API call
      
      await this.http.post(`${this.apiUrl}/auth/logout`, { uid: userId }).toPromise();
      
      console.log('awaiting Firbase signout...');
      // Firebase signout
      await signOut(this.auth);
      
      console.log('awaiting clear state...');
      // Clear state
      this.clearAuthState();
      
      console.log('Notification is being sent out...', userId);
      // Notification (will succeed even if navigation fails)
      this.sendLogoutNotification(userId, true);
      console.log('navigating back to the Login screen');
      // Navigation
      // await this.router.navigate(['/login']);
      
    } catch (error) {
      console.error('error signing out user: ', userId);
      this.sendLogoutNotification(userId || 'unknown', false);
      throw error;
    }
  }

  //OK
  private sendLogoutNotification(userId: string, success: boolean): void {
    this.notificationService.createSystemNotification({
      userId,
      title: success ? 'Logout Successful' : 'Logout Failed',
      message: success 
        ? 'You have been signed out successfully.' 
        : 'There was an error signing out. Please try again.',
      metadata: {
        urgency: 'high',
        channels: ['in-app'] // Always show in UI
      }
    }).subscribe({
      error: (err) => console.error('Failed to send logout notification:', err)
    });
  }

//OK
private clearAuthState(): void {
    // Clear observables/subjects
    this.currentUserSubject.next(null);
    
    // // Remove stored data
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    
    // Clear any caches
    this.userCache.clear();
    console.log('authstate is cleared...');
  }

//[refactored]
async initiateEmailVerificationForRegistration(
  email: string,
  password: string,
  roles: UserRole[]
): Promise<void> {
  const callbackUrl = `${window.location.origin}/verify-registration-email`;
  
  try {
    // 1. Prepare headers with conditional auth
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(await this.getAuthHeader()) // Optional auth header
    });

    // 2. API call with modern lastValueFrom()
    const response = await lastValueFrom(
      this.http.post<{
        success: boolean;
        userId: string;
        email: string;
        verificationLink: string;
      }>(
        `${this.apiUrl}/auth/initiate-verification`,
        { email, password, roles, callbackUrl },
        { headers }
      )
    );

    // 3. Process successful response
    if (!response?.success) {
      throw new Error('Registration failed: Server returned unsuccessful response');
    }

    await this.handlePostRegistration(response.userId, email, roles);
    await this.sendVerificationEmail(response.userId, response.verificationLink);
    
    this.showSuccess(`Verification email sent to ${email}`);
    this.router.navigate(['/verify-email-pending']);

  } catch (error) {
    // this.handleRegistrationError(error);
    console.log("Registration Error: ", error);
    throw error; // Re-throw for component handling
  }
}

// Helper method for conditional auth header
private async getAuthHeader(): Promise<{ [header: string]: string }> {
  try {
    const token = await this.getCurrentToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  } catch {
    return {}; // No token available
  }
}
// [refactored]
private async handlePostRegistration(
  userId: string,
  email: string,
  roles: UserRole[]
): Promise<void> {
  try {
    // 1. Complete user profile
    const userData = {
      displayName: this.generateDisplayName(email),
      avatarUrl: this.generateDefaultAvatar(email),
      profileComplete: false,
      uid: userId
    };


       const response = await this.http.patch<{ success: boolean; message: string 

         }>(`${environment.apiUrl}/auth/update-user`, userData
        ).toPromise();

    // 2. Initialize tasks
    const tasks = this.taskMapping.getTasksForUser(roles);
    await this.taskService.initializeTasksForRoles(userId, roles);

    // 3. Any other client-side setup
    // await this.setupNewUserPreferences(userId);

  } catch (error) {
    console.error('Post-registration setup failed:', error);
    // Optional: mark user as incomplete in database
  }
}

  // [needs refactoring]
  async handleVerifiedRegistrationEmail(): Promise<boolean> {
    try {
      console.log('handling the verified Reg email');
      // const confirmationResult = await applyActionCode(this.auth, oobCode);
      const verifiedEmail = this.auth.currentUser?.email;

      if (verifiedEmail) {
        const pendingUserString = localStorage.getItem('pendingUser');
        console.log('email is verified and the pendingUser is: ', pendingUserString);
        if (pendingUserString) {
          const pendingUser = JSON.parse(pendingUserString) as { email: string; password: string; roles: Roles };

          if (pendingUser.email === verifiedEmail) {
            // const userCredential = await createUserWithEmailAndPassword(this.auth, verifiedEmail, pendingUser.password);
            // const user = userCredential.user;
            const userId = this.getCurrentUserId();

            if (userId) {
              console.log('adding user to the firestore...');
              await setDoc(doc(this.firestore, `users/${userId}`), {
                uid: userId,
                email: verifiedEmail,
                roles: pendingUser.roles,
                emailVerified: true,
                registrationTimestamp: new Date(),
              });

              console.log('user saved to the firestore...');
              // 5. Set Custom Claims
              await this.setCustomClaims(userId, pendingUser.roles);

              localStorage.removeItem('pendingUser');
              this.showSuccess('Email verified successfully! You are now registered.');
              return true;
              // Optionally navigate the user
              this.router.navigate(['/dashboard/profile']);
            } else {
              this.showError('Failed to create user after email verification.');
              return false;
            }
          } else {
            this.showError('Verification email does not match the initial registration email.');
            localStorage.removeItem('pendingUser'); // Clear potentially mismatched data
            return false;
          }
        } else {
          this.showError('No pending registration data found.');
          return false;
        }
      } else {
        this.showError('Error retrieving verified email.');
        return false;
      }
    } catch (error: any) {
      console.log(this.transformAuthError(error).message);
      this.showError(this.transformAuthError(error).message);
      localStorage.removeItem('pendingUser'); // Clear data on error
      return false;
    }

  }


// Refactored
async registerUser(
  email: string,
  password: string,
  roles: ('admin' | 'requester' | 'bidder' | 'carrier')[]
): Promise<{ success: boolean; userId?: string }> {
  try {
    const response = await this.http.post<{
      success: boolean;
      userId: string;
    }>(`${environment.apiUrl}/auth/register`, {
      email,
      password,
      roles
    }).toPromise();

    return { 
      success: true, 
      userId: response?.userId 
    };
  } catch (error) {
    console.error('Registration failed:', error);
    return { 
      success: false 
    };
  }
}


/**** Helper Functions */
  private generateDisplayName(email: string): string {
    const firstThreeLetters = email.substring(0, 3).toLowerCase(); // First 3 letters
    const randomNumber = Math.floor(Math.random() * 1000); // Random number between 0 and 999
    return `${firstThreeLetters}${randomNumber}`; // Combine to create displayName
  }


  private generateDefaultAvatar(email: string, name?: string): string {
    // Extract first part of email if name not available
    const displayName = name || email.split('@')[0];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&length=2`;
  }


  private generateInitialsAvatar(name: string): string {
    // Example: "John Doe" → "JD"
    const initials = name.split(' ')
      .map(part => part[0]?.toUpperCase() || '')
      .join('')
      .slice(0, 2);

    // Use a service like DiceBear or UI Avatars
    return `https://ui-avatars.com/api/?name=${initials}&background=random`;
  }

  private getFriendlyUserId(email: string): string {
    return email.split('@')[0]; // Extract the part before the @ symbol
  }


  private async saveUserDataToLocalStorage(email: string, user: User): Promise<UserData> {
    try {
      // Get roles and await the observable
      const roles = await this.getCurrentUserRoles().toPromise();
      // Type-safe role extraction
      const role = roles && roles.length > 0
        ? (roles[0] as 'bidder' | 'requester' | 'carrier')
        : '';
console.log('setting userData in localstorage..', user);
      localStorage.setItem('role', role);
      const userData: UserData = {
        email:email!,
        role: role || 'requester' ,
        uid: user.uid,
        signedInDate: new Date().toISOString(),
      };

      localStorage.setItem('currentUser', JSON.stringify(userData));
      console.log("User data saved:", userData);
      return userData;
    } catch (error) {
      console.error("Failed to save user data:", error);
      throw error;
    }
  }
  async setAuthPersistence(mode: 'local' | 'session' | 'none') {
    try {
      switch (mode) {
        case 'local':
          await setPersistence(this.auth, browserLocalPersistence);
          break;
        case 'session':
          await setPersistence(this.auth, browserSessionPersistence);
          break;
        case 'none':
          await setPersistence(this.auth, inMemoryPersistence); // Requires custom implementation
          break;
      }
      console.log(`Persistence set to ${mode}`);
    } catch (error) {
      console.error('Error setting persistence:', error);
    }
  }

  // In UserContactService
  getAuthContactInfo(userId: string): Observable<UserContactInfo> {
    return user(this.auth).pipe(
      map(authUser => ({
        id: userId,
        email: authUser?.email || '',
        phone: authUser?.phoneNumber || '',
        name: authUser?.displayName || ''
      }))
    );
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn;
  }

  isAdmin(): boolean {
    return this.userRole === 'admin';
  }


  getCurrentUserRoles(): Observable<string[]> {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.log('user is null', user);
      return of([]);
    }
// Check local storage for anonymous users or if claims fail
  const localUserData: UserData | null = JSON.parse(
    localStorage.getItem('currentUser') || 'null'
  );
  
  // If user is anonymous (or claims fail), fall back to local storage role
  if (user.isAnonymous || !localUserData?.uid) {
    console.log('Checking local storage for role (anonymous or missing claims)');
    const role = localUserData?.role ? [localUserData.role] : [];
    if( role.length > 0 ){
    return  of(role);
  }
  }

    // For signed-in users, check Firebase ID token claims
  console.log('Fetching roles from Firebase ID token');
  return from(user.getIdToken(true)).pipe(
    switchMap(() => from(user.getIdTokenResult())),
    map((idTokenResult: IdTokenResult) => {
      const claims = idTokenResult.claims as CustomClaims;
      return claims.roles || [];
    }),
    catchError((error) => {
      console.error('Error fetching roles from token:', error);
      // Fall back to local storage if token fetch fails
      const role = localUserData?.role ? [localUserData.role] : [];
      return of(role);
    })
  );
}


  isRequester(): Observable<boolean> {
    return this.getCurrentUserRoles().pipe(
      map(roles => roles.includes('requester'))
    );
  }

  //   async getCurrentUserRoles(): Promise<string[]> {
  //     const auth = getAuth();
  //     const user = auth.currentUser;

  //     if (user) {
  //         try {
  //             // Force token refresh
  //             await user.getIdToken(true);

  //             const idTokenResult = await user.getIdTokenResult();
  //             console.log("idTokenResult: ", idTokenResult);
  //             const claims = idTokenResult.claims as CustomClaims;
  //             const roles = claims.roles || [];
  //             console.log('User roles:', roles);
  //             return roles;
  //         } catch (error) {
  //             console.error('Error fetching ID token result:', error);
  //             return [];
  //         }
  //     } else {
  //         console.log('No user is signed in.');
  //         return [];
  //     }
  // }
  // Get the current user value
  getCurrentUser() {
    return this.currentUserSubject.value;
  }

  // Get the current user value
  getCurrentUserEmail() {
    return this.currentUserEmail;
  }


  private transformAuthError(error: any): Error {
    switch (error.code) {
      case 'auth/missing-password':
        return new Error('Current password is required');
      case 'auth/wrong-password':
        return new Error('Incorrect current password');
      case 'auth/requires-recent-login':
        return new Error('Session expired. Please login again');
      default:
        return new Error(error.message || 'Authentication failed');
    }
  }


  
  async initiateEmailChange(newEmail: string, currentPassword: string): Promise<void> {
    const user = this.currentUser;
    if (!user || !user.email) {
      throw new Error('No authenticated user found');
    }

    // 1. Reauthenticate first
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // 2. Send verification to the NEW email
    const actionCodeSettings = {
      url: `${window.location.origin}/verify-email?newEmail=${encodeURIComponent(newEmail)}`,
      handleCodeInApp: true
    };

    await sendEmailVerification(user, actionCodeSettings);
    this.showInfo('Verification email sent to your new address {$actionCodeSettings}');
  }





  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  async sendEmailVerification(user: User): Promise<void> {
    await sendEmailVerification(user);
  }
  async requestEmailChangeForFake(newEmail: string, currentPassword: string): Promise<void> {
    const user = this.currentUser;
    if (!user) {
      throw new Error('No authenticated user found');
    }

    try {
      // 1. Reauthenticate first
      const credential = EmailAuthProvider.credential(user.email || '', currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Store the pending email change FIRST in Firestore
      await this.updateUserData({
        pendingEmail: newEmail,
        pendingEmailTimestamp: new Date().toISOString(),
      });

      // 3. Configure email verification settings with a link back to your app
      const actionCodeSettings = {
        url: `${window.location.origin}/verify-email?uid=${user.uid}`,
        handleCodeInApp: true,
      };

      // 4. Send verification to the NEW email
      await sendEmailVerification(user, actionCodeSettings);

      this.showSuccess(`Verification email sent to ${newEmail}. Please verify your new email address.`);

    } catch (error) {
      // Clean up pending email if failed
      await this.updateUserData({ pendingEmail: null, pendingEmailTimestamp: null });
      this.showError(this.transformAuthError(error).message);
      throw error;
    }
  }

  async completeEmailChange(uid: string): Promise<void> {
    try {
      // 1. Get the pending email request from Firestore
      const userDoc = await getDoc(doc(this.firestore, 'users', uid));
      const userData = userDoc.data() as { pendingEmail?: string };
      const pendingEmail = userData?.pendingEmail;

      if (!pendingEmail) {
        throw new Error('No pending email change request found.');
      }

      const user = this.auth.currentUser; // Get the latest user object
      if (!user) {
        throw new Error('Not authenticated.');
      }

      // 2. Actually update the email in Firebase Authentication
      await updateEmail(user, pendingEmail);

      // 3. Clear the pending request in Firestore and update the main email
      await this.updateUserData({
        email: pendingEmail,
        pendingEmail: null,
        pendingEmailTimestamp: null,
      });

      // 4. Optional: Send a confirmation email to the *new* email address (can be done after Auth update)
      await sendEmailVerification(user); // This will send another verification to the *new* email

      this.showSuccess('Email address successfully updated!');

    } catch (error) {
      console.error('Error completing email change:', error);
      this.showError(this.transformAuthError(error).message);
      throw error;
    }
  }




async updateUserData(updates: Record<string, any>): Promise<void> {
    console.log('[AuthService] updateUserData called with:', updates);
    
    const user = this.auth.currentUser;
    if (!user) {
        throw new Error('No authenticated user');
    }

    try {
      
   
        const response = await this.http.patch<{ success: boolean; message: string 

         }>(`${environment.apiUrl}/auth/update-user`, {
                uid: user.uid,
                updates
            }
        ).toPromise();

        if (response?.success) {
            console.log('User data updated successfully');
            // Optional: Update local state if needed
            this.currentUserSubject.next(user as User);
        }
    } catch (error:any) {
        console.error('Failed to update user data:', error);
        throw new Error(
            error.error?.error || 
            error.error?.message || 
            'Failed to update user data'
        );
    }
}
  async updatePassword(newPassword: string, currentPassword?: string): Promise<void> {
    try {
      const user = this.currentUser;
      if (!user) {
        throw new Error('You must be logged in to change your password');
      }

      if (currentPassword) {
        await this.reauthenticate(currentPassword);
      }

      await updatePassword(user, newPassword);
      this.showSuccess('Password changed successfully');
    } catch (error) {
      this.showError(this.getErrorMessage(error));
      throw error; // Re-throw for component handling
    }
  }
  // Refactored
  async updateUserSettings(settings: { darkMode?: boolean; language?: string }): Promise<void> {
    const user = await firstValueFrom(this.currentUser$);
    if (!user) throw new Error('No user logged in');

    try {
        const response = await this.http.patch<{
            success: boolean;
            message: string;
        }>(`/auth/users/${user.uid}/settings`, {
            settings
        }).toPromise();

        if (!response?.success) {
            throw new Error(response?.message || 'Settings update failed');
        }

    } catch (error:any) {
        console.error('Failed to update settings:', error);
        throw new Error(
            error.error?.error || 
            error.message || 
            'Failed to update user settings'
        );
    }
}

// OK
  private async reauthenticate(currentPassword: string): Promise<void> {
    const user = this.currentUser;
    if (!user?.email) throw new Error('No user logged in');

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
  }
  
  // [refactored]
async sendVerificationEmail(userOrEmail: User | string, redirectUrl?: string): Promise<void> {
  try {
    let email: string;
    let verificationLink: string;

    if (typeof userOrEmail === 'string') {
      // New API-based approach
      const response = await this.http.post<{
        success: boolean;
        verificationLink: string;
        email: string;
      }>(`${this.apiUrl}/auth/send-verification`, {
        email: userOrEmail,
        redirectUrl: redirectUrl || `${window.location.origin}/dashboard`
      }).toPromise();

      if (!response?.success) throw new Error('Failed to generate verification link');
      email = response.email;
      verificationLink = response.verificationLink;
    } else {
      // Legacy Firebase client approach (phase-out eventually)
      const actionCodeSettings = {
        url: redirectUrl || `${window.location.origin}/dashboard`,
        handleCodeInApp: true
      };
      verificationLink = await this.generateVerificationLink(userOrEmail, actionCodeSettings);
      email = userOrEmail.email || '';
    }

    // Send the email using your email service
    await this.emailService.sendVerificationEmail(email, verificationLink);
    console.log('Verification email sent successfully to:', email);

  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

// Helper method for legacy Firebase approach

  getFriendlyErrorMessage(error: any): string {
    if (error && error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          return 'No user found with that email.';
        case 'auth/invalid-credential':
          return 'Please enter a valid  email and password';
        case 'auth/wrong-password':
          return 'Incorrect password.';
        case 'auth/email-already-in-use':
          return 'This email address is already in use.';
        case 'auth/invalid-email':
          return 'Please enter a valid email address.';
        case 'auth/user-disabled':
          return 'This user account has been disabled.';
        case 'auth/too-many-requests':
          return 'Too many attempts. Please try again later.';
        // Add more cases for other common error codes
        default:
          return 'An unexpected error occurred. Please try again.';
      }
    } else if (error && error.message) {
      // Fallback to the raw error message if no code is available
      return error.message;
    } else {
      return 'An unknown error occurred.';
    }
  }
  private getErrorMessage(error: any): string {
    if (error.message) return error.message;

    switch (error.code) {
      case 'auth/requires-recent-login':
        return 'Please re-enter your current password to continue';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters';
      default:
        return 'An error occurred. Please try again';
    }
  }
 
private async generateVerificationLink(user: User, actionCodeSettings: ActionCodeSettings): Promise<string> {
  // Note: This will only work if you're still using Firebase client SDK
  // During migration phase only - remove when fully migrated
  return new Promise((resolve, reject) => {
    sendEmailVerification(user, actionCodeSettings)
      .then(() => {
        // In the client SDK, we don't get the link directly
        // So we need to either:
        // 1. Have the user check their email (traditional flow)
        // 2. Or implement a workaround to get the link
        reject(new Error('Client-side verification requires email client'));
      })
      .catch(reject);
  });
}
//OK
  async signInWithEmailAndPasswordAndUpdateRequests(email: string, password: string): Promise<UserCredential | null> {
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = credential.user;

      // Check for anonymous requests and update them
      await this.updateAnonymousRequests(user.uid, email);

      return credential;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }
//Refactored
 async updateAnonymousRequests(newUserId: string, newEmail: string): Promise<number> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
        throw new Error('No authenticated user');
    }

    try {
        const response = await this.http.post<{
            success: boolean;
            updatedCount: number;
        }>('/auth/update-anonymous-requests', {
            originalUserId: currentUser.uid, // The original anonymous ID
            newUserId,
            newEmail
        }).toPromise();

        if (!response?.success) {
            throw new Error('Failed to update requests');
        }

        console.log(`Updated ${response.updatedCount} shipment requests`);
        return response.updatedCount;

    } catch (error:any) {
        console.error('Request update error:', error);
        throw new Error(
            error.error?.error || 
            error.message || 
            'Failed to update shipment requests'
        );
    }
}
//Refactored

async linkAccount(credential: AuthCredential): Promise<User> {
    console.warn('[DEPRECATED] linkAccount() - Prefer linkAccountAndUpdateRequests() for future development');
    
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
        throw new Error('No authenticated user found');
    }

    try {
        // Reuse the robust implementation
        await this.linkAccountAndUpdateRequests(credential);
        return currentUser;
    } catch (error) {
        console.error('Account linking failed:', error);
        throw new Error(
            error instanceof Error ? error.message : 'Unknown linking error'
        );
    }
}
// Refactored
async linkAccountAndUpdateRequests(credential: AuthCredential): Promise<{ updatedRequests: number }> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No authenticated user');

    try {
        // 1. Client-side credential linking (required)
        const result = await linkWithCredential(user, credential);
        
        // 2. Server-side updates (Firestore, request migration, etc.)
        const response = await this.http.post<{ 
            success: boolean;
            updatedRequests: number;
        }>('/auth/handle-account-link', {
            uid: user.uid,
            email: result.user.email,
            credential: credential.toJSON()
        }).toPromise();

        if (!response?.success) throw new Error('Post-linking updates failed');
        return { updatedRequests: response.updatedRequests };

    } catch (error:any) {
        console.error('Account linking failed:', error);
        throw new Error(
            error.error?.error || 
            error.message || 
            'Failed to link account'
        );
    }
}
  showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 5000 });
  }

  showInfo(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 5000 });
  }
  showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }








  async getCurrentUserOnce(): Promise<User | null> {
    return await firstValueFrom(this.currentUser$);
  }




}