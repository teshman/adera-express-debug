// src/models/types.ts

// Define your user roles
export type UserRole = 'admin' | 'requester' | 'bidder' | 'carrier' | 'guest';

// Define the structure of custom claims you expect from Firebase ID tokens
export interface CustomClaims {
  roles?: UserRole[];
  // Add other custom claims here if you use them
  [key: string]: any; // Allow for other properties
}

// Basic user data structure for local storage/display
export interface UserData {
    email: string;
    uid: string;
    role: string; // e.g., 'admin', 'user', 'guest' - typically the primary role
    signedInDate: string; // ISO string format
}

// Add other shared interfaces here as needed, e.g., ShipmentRequest, Bid, etc.
// export interface ShipmentRequest { /* ... */ }
// export interface Bid { /* ... */ }
