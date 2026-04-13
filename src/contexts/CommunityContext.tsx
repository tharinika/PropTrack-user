import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useProperties } from './PropertiesContext';
import { useAuth } from './AuthContext';
import { firestore } from '../lib/firebase.ts';

interface Message {
  id: string;
  sender: string;
  senderId: string;
  senderRole: 'landlord' | 'tenant';
  content: string;
  timestamp: string;
  type: 'text' | 'payment-request';
  paymentAmount?: number;
  festivalPaymentId?: string;
}

interface Member {
  userId: string;
  name: string;
  role: 'landlord' | 'tenant';
  unitId?: string;
  joinedAt: string;
}

interface FestivalPayment {
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
}

interface FestivalPaymentStatus {
  id: string;
  festivalId: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  status: 'Pending' | 'Paid';
  paidAt?: string;
}

interface FestivalPaymentWithStatus extends FestivalPayment {
  tenantPayments: FestivalPaymentStatus[];
}

interface PersonalMessage {
  id: string;
  sender: string;
  senderId: string;
  senderRole: 'landlord' | 'tenant';
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface PersonalChat {
  tenantId: string;
  tenantName: string;
  messages: PersonalMessage[];
  unreadCount: number;
  lastMessageTimestamp: string;
}

interface Community {
  id: string;
  name: string;
  property: string;
  propertyId: string;
  memberCount: number;
  members: string[];
  messages: Message[];
  festivalPayments: FestivalPayment[];
}

interface CommunityContextType {
  communities: Community[];
  personalChats: PersonalChat[];
  addMessage: (communityId: string, message: Message) => Promise<void>;
  addTenantToCommunity: (propertyName: string, tenantName: string, tenantId: string, unitId?: string) => Promise<void>;
  removeTenantFromCommunity: (propertyName: string, tenantName: string, tenantId: string) => Promise<void>;
  updateTenantInCommunity: (oldPropertyName: string, newPropertyName: string, oldTenantName: string, newTenantName: string, tenantId: string, newUnitId?: string) => Promise<void>;
  createFestivalPayment: (communityId: string, festivalName: string, totalAmount: number, tenants: any[]) => Promise<void>;
  updateFestivalPaymentStatus: (communityId: string, festivalPaymentId: string, tenantId: string, status: 'paid' | 'pending' | 'overdue') => Promise<void>;
  addPersonalMessage: (tenantId: string, message: PersonalMessage) => Promise<void>;
  createPersonalChat: (tenantId: string, tenantName: string) => void;
  markPersonalChatAsRead: (tenantId: string) => Promise<void>;
  getLandlordChatForTenant: (tenantId: string, landlordName: string) => PersonalChat | null;
  addTenantLandlordMessage: (tenantId: string, landlordName: string, message: PersonalMessage) => Promise<void>;
  getTenantPropertyCommunity: (propertyName: string) => Community | null;
  loading: boolean;
}

interface TenantInfo {
  id: string;
  name: string;
  property: string;
  unit: string;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

interface CommunityProviderProps {
  children: ReactNode;
  tenants?: TenantInfo[];
}

export function CommunityProvider({ children, tenants: externalTenants = [] }: CommunityProviderProps) {
  const { properties } = useProperties();
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [personalChats, setPersonalChats] = useState<PersonalChat[]>([]);
  const [loading, setLoading] = useState(true);

  // ============================================================================
  // REAL-TIME SYNC - Initialize communities from properties and subscribe
  // ============================================================================
  
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribers: (() => void)[] = [];
    
    // Initialize communities for all properties
    const initializeCommunities = async () => {
      setLoading(true);
      
      for (const property of properties) {
        // Initialize community in Firestore if it doesn't exist
        await firestore.initializeCommunity(
          property.id,
          property.name,
          user.id || 'landlord-1',
          user.name || 'Landlord'
        );
        
        // Add tenants from externalTenants using property name matching
        const propertyTenants = externalTenants.filter(tenant => tenant.property === property.name);
        const addedTenantIds = new Set();

// ✅ Add from external tenants (ONLY ONCE)
for (const tenant of propertyTenants) {
  if (!addedTenantIds.has(tenant.id)) {
    await firestore.addMemberToCommunity(
      property.id,
      tenant.id,
      tenant.name,
      'tenant',
      tenant.unit
    );
    addedTenantIds.add(tenant.id);
  }
}

// ✅ Add from units ONLY if not already added
for (const unit of property.units || []) {
  if (
    unit.status === 'occupied' &&
    unit.tenant &&
    unit.tenantId &&
    !addedTenantIds.has(unit.tenantId)
  ) {
    await firestore.addMemberToCommunity(
      property.id,
      unit.tenantId,
      unit.tenant,
      'tenant',
      unit.id
    );
    addedTenantIds.add(unit.tenantId);
  }
}
        
        // Subscribe to real-time updates for this community
        const unsubscribe = firestore.onSnapshot(
          `communities/${property.id}`,
          async (communityData) => {
            if (communityData) {
              // Convert Firestore data to Community format
              const members = firestore.getCollectionArray(communityData.members || {});
              const messages = firestore.getCollectionArray(communityData.messages || {});
              
              // Get festival payments from top-level collections
              const festivalPaymentsData = await firestore.getDoc('festivalPayments');
              const allFestivalPayments = festivalPaymentsData ? firestore.getCollectionArray(festivalPaymentsData) : [];
              
              // Filter festival payments for this community
              const communityFestivalPayments = allFestivalPayments.filter(
                (payment: FestivalPayment) => payment.communityId === property.id
              );
              
              const community: Community = {
                id: communityData.id,
                name: `${communityData.propertyName} Community`,
                property: communityData.propertyName,
                propertyId: communityData.propertyId,
                memberCount: members.filter((m: Member) => m.role === 'tenant').length,
                members: members.filter((m: Member) => m.role === 'tenant').map((m: Member) => m.name),
                messages: messages.sort((a: Message, b: Message) => 
                  new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                ),
                festivalPayments: communityFestivalPayments
              };
              
              // Update communities state
              setCommunities(prev => {
                const filtered = prev.filter(c => c.id !== property.id);
                return [...filtered, community].sort((a, b) => a.name.localeCompare(b.name));
              });
            }
          }
        );
        
        unsubscribers.push(unsubscribe);
      }
      
      // Also subscribe to festival payments collection for real-time updates
      const festivalPaymentsUnsub = firestore.onSnapshot(
        'festivalPayments',
        async () => {
          // Trigger a re-render by updating communities
          // The communities listener will fetch the latest festival payments
          for (const property of properties) {
            const communityData = await firestore.getDoc(`communities/${property.id}`);
            if (communityData) {
              const members = firestore.getCollectionArray(communityData.members || {});
              const messages = firestore.getCollectionArray(communityData.messages || {});
              
              const festivalPaymentsData = await firestore.getDoc('festivalPayments');
              const allFestivalPayments = festivalPaymentsData ? firestore.getCollectionArray(festivalPaymentsData) : [];
              const communityFestivalPayments = allFestivalPayments.filter(
                (payment: FestivalPayment) => payment.communityId === property.id
              );
              
              const community: Community = {
                id: communityData.id,
                name: `${communityData.propertyName} Community`,
                property: communityData.propertyName,
                propertyId: communityData.propertyId,
                memberCount: members.filter((m: Member) => m.role === 'tenant').length,
                members: members.filter((m: Member) => m.role === 'tenant').map((m: Member) => m.name),
                messages: messages.sort((a: Message, b: Message) => 
                  new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                ),
                festivalPayments: communityFestivalPayments
              };
              
              setCommunities(prev => {
                const filtered = prev.filter(c => c.id !== property.id);
                return [...filtered, community].sort((a, b) => a.name.localeCompare(b.name));
              });
            }
          }
        }
      );
      
      unsubscribers.push(festivalPaymentsUnsub);
      
      setLoading(false);
    };
    
    initializeCommunities();
    
    // Cleanup: Unsubscribe from all listeners
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [properties, user, externalTenants]);

  // ============================================================================
  // REAL-TIME SYNC - Personal chats
  // ============================================================================
  
  useEffect(() => {
    if (!user) return;

    // Subscribe to all personal chats where user is landlord
    const unsubscribe = firestore.onSnapshot(
      'personalChats',
      (chatsData) => {
        if (chatsData) {
          const allChats = firestore.getCollectionArray(chatsData);
          
          // Filter chats where current user is landlord
          const userChats = allChats.filter((chat: any) => 
            chat.landlordId === (user.id || 'landlord-1')
          );
          
          // Convert to PersonalChat format
          const formattedChats: PersonalChat[] = userChats.map((chat: any) => {
            const messages = firestore.getCollectionArray(chat.messages || {});
            const sortedMessages = messages.sort((a: PersonalMessage, b: PersonalMessage) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            
            const unreadCount = sortedMessages.filter(
              (m: PersonalMessage) => !m.isRead && m.senderRole === 'tenant'
            ).length;
            
            return {
              tenantId: chat.tenantId,
              tenantName: chat.tenantName,
              messages: sortedMessages,
              unreadCount,
              lastMessageTimestamp: chat.lastMessageTimestamp
            };
          });
          
          setPersonalChats(formattedChats);
        }
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [user]);

  // ============================================================================
  // METHODS - All operations now use Firestore with real-time sync
  // ============================================================================

  const addMessage = async (communityId: string, message: Message) => {
    await firestore.addMessageToCommunity(communityId, message);
    // Real-time listener will automatically update the UI
  };

  const addTenantToCommunity = async (propertyName: string, tenantName: string, tenantId: string, unitId?: string) => {
    const property = properties.find(p => p.name === propertyName);
    if (!property) return;
    
    await firestore.addMemberToCommunity(
      property.id,
      tenantId,
      tenantName,
      'tenant',
      unitId
    );
    // Real-time listener will automatically update the UI
  };

  const removeTenantFromCommunity = async (propertyName: string, tenantName: string, tenantId: string) => {
    const property = properties.find(p => p.name === propertyName);
    if (!property) return;
    
    await firestore.removeMemberFromCommunity(property.id, tenantId);
    // Real-time listener will automatically update the UI
  };

  const updateTenantInCommunity = async (
    oldPropertyName: string,
    newPropertyName: string,
    oldTenantName: string,
    newTenantName: string,
    tenantId: string,
    newUnitId?: string
  ) => {
    // Remove from old property
    const oldProperty = properties.find(p => p.name === oldPropertyName);
    if (oldProperty) {
      await firestore.removeMemberFromCommunity(oldProperty.id, tenantId);
    }
    
    // Add to new property
    const newProperty = properties.find(p => p.name === newPropertyName);
    if (newProperty) {
      await firestore.addMemberToCommunity(
        newProperty.id,
        tenantId,
        newTenantName,
        'tenant',
        newUnitId
      );
    }
    // Real-time listener will automatically update the UI
  };

  const createFestivalPayment = async (communityId: string, festivalName: string, totalAmount: number, tenants: any[]) => {
    const perTenantAmount = Math.round(totalAmount / tenants.length);
    
    // Set due date to 7 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    
    const festivalId = `festival-${Date.now()}`;
    
    // Create festival payment in top-level collection
    const festivalPayment = {
      id: festivalId,
      landlordId: user?.id || 'landlord-1',
      propertyId: properties.find(p => p.id === communityId)?.id || '',
      communityId,
      festivalName,
      totalAmount,
      perTenantAmount,
      createdAt: new Date().toISOString(),
      dueDate: dueDate.toISOString(),
      status: 'active' as const
    };
    
    await firestore.setDoc(`festivalPayments/${festivalId}`, festivalPayment);
    
    // Create status records for each tenant in top-level collection
    for (const tenant of tenants) {
      const statusId = `${festivalId}_${tenant.id}`;
      const statusRecord = {
        id: statusId,
        festivalId,
        tenantId: tenant.id,
        tenantName: tenant.name,
        amount: perTenantAmount,
        status: 'Pending' as const
      };
      
      await firestore.setDoc(`festivalPaymentStatus/${statusId}`, statusRecord);
    }
    
    // Real-time listener will automatically update the UI
  };

  const updateFestivalPaymentStatus = async (
    communityId: string,
    festivalPaymentId: string,
    tenantId: string,
    status: 'paid' | 'pending' | 'overdue'
  ) => {
    const statusId = `${festivalPaymentId}_${tenantId}`;
    const newStatus = status === 'paid' ? 'Paid' : status === 'pending' ? 'Pending' : 'Pending'; // Map to capitalized format
    
    await firestore.updateDoc(`festivalPaymentStatus/${statusId}`, {
      status: newStatus,
      paidAt: status === 'paid' ? new Date().toISOString() : undefined
    });
    
    // Real-time listener will automatically update the UI
  };

  const addPersonalMessage = async (tenantId: string, message: PersonalMessage) => {
    const landlordId = user?.id || 'landlord-1';
    const tenant = personalChats.find(chat => chat.tenantId === tenantId);
    const tenantName = tenant?.tenantName || 'Tenant';
    
    await firestore.addPersonalMessage(landlordId, tenantId, tenantName, message);
    // Real-time listener will automatically update the UI
  };

  const createPersonalChat = (tenantId: string, tenantName: string) => {
    // Personal chat is created automatically when first message is sent
    // This method is kept for compatibility
  };

  const markPersonalChatAsRead = async (tenantId: string) => {
    const landlordId = user?.id || 'landlord-1';
    const chatId = `${landlordId}_${tenantId}`;
    const chatData = await firestore.getDoc(`personalChats/${chatId}`);
    
    if (chatData && chatData.messages) {
      const messages = firestore.getCollectionArray(chatData.messages);
      
      for (const message of messages) {
        if (!message.isRead && message.senderRole === 'tenant') {
          await firestore.updateDoc(`personalChats/${chatId}/messages/${message.id}`, {
            isRead: true
          });
        }
      }
    }
    // Real-time listener will automatically update the UI
  };

  const getLandlordChatForTenant = (tenantId: string, landlordName: string) => {
    return personalChats.find(chat => chat.tenantId === tenantId) || null;
  };

  const addTenantLandlordMessage = async (tenantId: string, landlordName: string, message: PersonalMessage) => {
    const landlordId = user?.id || 'landlord-1';
    
    await firestore.addPersonalMessage(landlordId, tenantId, landlordName, message);
    // Real-time listener will automatically update the UI
  };

  const getTenantPropertyCommunity = (propertyName: string) => {
    return communities.find(community => community.property === propertyName) || null;
  };

  return (
    <CommunityContext.Provider value={{ 
      communities, 
      personalChats,
      addMessage, 
      addTenantToCommunity,
      removeTenantFromCommunity,
      updateTenantInCommunity,
      createFestivalPayment,
      updateFestivalPaymentStatus,
      addPersonalMessage,
      createPersonalChat,
      markPersonalChatAsRead,
      getLandlordChatForTenant,
      addTenantLandlordMessage,
      getTenantPropertyCommunity,
      loading
    }}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error('useCommunity must be used within a CommunityProvider');
  }
  return context;
}