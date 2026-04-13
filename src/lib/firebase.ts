// Firebase configuration and initialization
// This simulates Firebase/Firestore structure using localStorage for persistence
// In production, replace with actual Firebase SDK

export interface FirestoreDocument {
  id: string;
  [key: string]: any;
}

export interface FirestoreCollection {
  [docId: string]: FirestoreDocument;
}

// Simulated Firestore database structure
interface FirestoreDatabase {
  communities: {
    [propertyId: string]: {
      id: string;
      propertyId: string;
      propertyName: string;
      landlordId: string;
      landlordName: string;
      createdAt: string;
      members?: {
        [memberId: string]: {
          userId: string;
          name: string;
          role: 'landlord' | 'tenant';
          unitId?: string;
          joinedAt: string;
        };
      };
      messages?: {
        [messageId: string]: {
          id: string;
          sender: string;
          senderId: string;
          senderRole: 'landlord' | 'tenant';
          content: string;
          timestamp: string;
          type: 'text' | 'payment-request';
          paymentAmount?: number;
          festivalPaymentId?: string;
        };
      };
    };
  };
  festivalPayments: {
    [paymentId: string]: {
      id: string;
      landlordId: string;
      propertyId: string;
      communityId: string;
      festivalName: string;
      totalAmount: number;
      perTenantAmount: number;
      createdAt: string;
      dueDate: string;
      status: 'active' | 'completed';
    };
  };
  festivalPaymentStatus: {
    [statusId: string]: {
      id: string;
      festivalId: string;
      tenantId: string;
      tenantName: string;
      amount: number;
      status: 'Pending' | 'Paid';
      paidAt?: string;
    };
  };
  personalChats: {
    [chatId: string]: {
      id: string;
      landlordId: string;
      tenantId: string;
      tenantName: string;
      messages?: {
        [messageId: string]: {
          id: string;
          sender: string;
          senderId: string;
          senderRole: 'landlord' | 'tenant';
          content: string;
          timestamp: string;
          isRead: boolean;
        };
      };
      lastMessageTimestamp: string;
    };
  };
}

// Listener callback type
type ListenerCallback = (data: any) => void;

// Global listeners storage
const listeners: {
  [path: string]: ListenerCallback[];
} = {};

// Initialize database from localStorage or create empty structure
function initDatabase(): FirestoreDatabase {
  const stored = localStorage.getItem('firestore_db');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored database:', e);
    }
  }
  
  return {
    communities: {},
    festivalPayments: {},
    festivalPaymentStatus: {},
    personalChats: {}
  };
}

// Get current database
function getDatabase(): FirestoreDatabase {
  return initDatabase();
}

// Save database to localStorage
function saveDatabase(db: FirestoreDatabase): void {
  localStorage.setItem('firestore_db', JSON.stringify(db));
  notifyListeners(db);
}

// Notify all active listeners
function notifyListeners(db: FirestoreDatabase): void {
  Object.keys(listeners).forEach(path => {
    const callbacks = listeners[path];
    const data = getDataAtPath(db, path);
    callbacks.forEach(callback => callback(data));
  });
}

// Get data at specific path
function getDataAtPath(db: FirestoreDatabase, path: string): any {
  const parts = path.split('/');
  let current: any = db;
  
  for (const part of parts) {
    if (!current || typeof current !== 'object') return null;
    current = current[part];
  }
  
  return current;
}

// Set data at specific path
function setDataAtPath(db: FirestoreDatabase, path: string, data: any): FirestoreDatabase {
  const parts = path.split('/');
  const newDb = JSON.parse(JSON.stringify(db)); // Deep clone
  let current: any = newDb;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  }
  
  const lastPart = parts[parts.length - 1];
  current[lastPart] = data;
  
  return newDb;
}

// Firestore-like API
export const firestore = {
  // Subscribe to real-time updates
  onSnapshot(path: string, callback: ListenerCallback): () => void {
    // Initialize listener array for this path
    if (!listeners[path]) {
      listeners[path] = [];
    }
    
    // Add callback
    listeners[path].push(callback);
    
    // Immediately call with current data
    const db = getDatabase();
    const data = getDataAtPath(db, path);
    callback(data);
    
    // Return unsubscribe function
    return () => {
      listeners[path] = listeners[path].filter(cb => cb !== callback);
      if (listeners[path].length === 0) {
        delete listeners[path];
      }
    };
  },
  
  // Get document
  async getDoc(path: string): Promise<any> {
    const db = getDatabase();
    return getDataAtPath(db, path);
  },
  
  // Set document (create or overwrite)
  async setDoc(path: string, data: any): Promise<void> {
    const db = getDatabase();
    const newDb = setDataAtPath(db, path, data);
    saveDatabase(newDb);
  },
  
  // Update document (merge)
  async updateDoc(path: string, data: any): Promise<void> {
    const db = getDatabase();
    const existing = getDataAtPath(db, path) || {};
    const merged = { ...existing, ...data };
    const newDb = setDataAtPath(db, path, merged);
    saveDatabase(newDb);
  },
  
  // Add to subcollection
  async addToSubcollection(path: string, data: any): Promise<string> {
    const db = getDatabase();
    const collection = getDataAtPath(db, path) || {};
    const id = data.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newDoc = { ...data, id };
    collection[id] = newDoc;
    const newDb = setDataAtPath(db, path, collection);
    saveDatabase(newDb);
    return id;
  },
  
  // Delete from subcollection
  async deleteFromSubcollection(path: string, docId: string): Promise<void> {
    const db = getDatabase();
    const collection = getDataAtPath(db, path) || {};
    delete collection[docId];
    const newDb = setDataAtPath(db, path, collection);
    saveDatabase(newDb);
  },
  
  // Get collection as array
  getCollectionArray(collectionData: any): any[] {
    if (!collectionData || typeof collectionData !== 'object') return [];
    return Object.values(collectionData);
  },
  
  // Initialize community if not exists
  async initializeCommunity(propertyId: string, propertyName: string, landlordId: string, landlordName: string): Promise<void> {
    const db = getDatabase();
    const existing = getDataAtPath(db, `communities/${propertyId}`);
    
    if (!existing) {
      const communityData = {
        id: propertyId,
        propertyId,
        propertyName,
        landlordId,
        landlordName,
        createdAt: new Date().toISOString(),
        members: {
          [landlordId]: {
            userId: landlordId,
            name: landlordName,
            role: 'landlord' as const,
            joinedAt: new Date().toISOString()
          }
        },
        messages: {
          [`welcome-${propertyId}`]: {
            id: `welcome-${propertyId}`,
            sender: landlordName,
            senderId: landlordId,
            senderRole: 'landlord' as const,
            content: `Welcome to ${propertyName} Community! Feel free to share any announcements or concerns here.`,
            timestamp: new Date().toISOString(),
            type: 'text' as const
          }
        }
      };
      
      await this.setDoc(`communities/${propertyId}`, communityData);
    }
  },
  
  // Add member to community
  async addMemberToCommunity(propertyId: string, userId: string, userName: string, role: 'landlord' | 'tenant', unitId?: string): Promise<void> {
    const memberData = {
      userId,
      name: userName,
      role,
      unitId,
      joinedAt: new Date().toISOString()
    };
    
    await this.setDoc(`communities/${propertyId}/members/${userId}`, memberData);
    
    // Add welcome message
    const welcomeMessage = {
      id: `welcome-${userId}-${Date.now()}`,
      sender: 'System',
      senderId: 'system',
      senderRole: 'landlord' as const,
      content: `Welcome ${userName} to the community! 🎉`,
      timestamp: new Date().toISOString(),
      type: 'text' as const
    };
    
    await this.addToSubcollection(`communities/${propertyId}/messages`, welcomeMessage);
  },
  
  // Remove member from community
  async removeMemberFromCommunity(propertyId: string, userId: string): Promise<void> {
    await this.deleteFromSubcollection(`communities/${propertyId}/members`, userId);
  },
  // Update member inside community (🔥 NEW)
async updateMemberInCommunity(
  propertyId: string,
  userId: string,
  updates: any
): Promise<void> {
  const db = getDatabase();

  const existing = getDataAtPath(
    db,
    `communities/${propertyId}/members/${userId}`
  ) || {};

  const updatedMember = {
    ...existing,
    ...updates
  };

  const newDb = setDataAtPath(
    db,
    `communities/${propertyId}/members/${userId}`,
    updatedMember
  );

  saveDatabase(newDb);
},
  // Add message to community
  async addMessageToCommunity(propertyId: string, message: any): Promise<void> {
    await this.addToSubcollection(`communities/${propertyId}/messages`, message);
  },
  
  // Add personal message
  async addPersonalMessage(landlordId: string, tenantId: string, tenantName: string, message: any): Promise<void> {
    const chatId = `${landlordId}_${tenantId}`;
    
    // Ensure chat exists
    const existing = await this.getDoc(`personalChats/${chatId}`);
    if (!existing) {
      await this.setDoc(`personalChats/${chatId}`, {
        id: chatId,
        landlordId,
        tenantId,
        tenantName,
        messages: {},
        lastMessageTimestamp: new Date().toISOString()
      });
    }
    
    // Add message
    await this.addToSubcollection(`personalChats/${chatId}/messages`, message);
    
    // Update last message timestamp
    await this.updateDoc(`personalChats/${chatId}`, {
      lastMessageTimestamp: message.timestamp
    });
  }
};

// Export for testing/debugging
if (typeof window !== 'undefined') {
  (window as any).firestore = firestore;
}