import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { supabase } from '../../lib/supabase';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../ui/dialog';
import { GradientButton } from '../GradientButton';
import { EmptyState } from './EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { useProperties } from '../../contexts/PropertiesContext';
import { useCommunity } from '../../contexts/CommunityContext';
import { useAppData } from '../../contexts/AppDataContext';
import { MessageCircle, Send, Users, DollarSign, PartyPopper, Crown, User, ChevronDown, CheckCircle2, Clock, AlertCircle, ChevronUp, Search, X, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mockTenants } from '../../data/mockData';
import { toast } from 'sonner@2.0.3';

interface Message {
  id: string;
  sender: string;
  senderRole: 'landlord' | 'tenant';
  content: string;
  timestamp: string;
  type: 'text' | 'payment-request';
  paymentAmount?: number;
  festivalPaymentId?: string;
}

interface PersonalMessage {
  id: string;
  sender: string;
  senderRole: 'landlord' | 'tenant';
  content: string;
  timestamp: string;
  isRead: boolean;
}
function generateChatId(id1: string, id2: string) {
  return [id1, id2].sort().join('_');
}

export function CommunityView() {
  const { user } = useAuth();
  
  const { properties } = useProperties();
  const { communities, personalChats, addMessage, createFestivalPayment, updateFestivalPaymentStatus, addPersonalMessage, createPersonalChat, markPersonalChatAsRead } = useCommunity();
  const { tenants } = useAppData();
  console.log("tenants raw:",tenants);
  const uniqueTenants = tenants.filter(
  (t, index, self) =>
    index === self.findIndex(x => x.name === t.name)
);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isFestivalDialogOpen, setIsFestivalDialogOpen] = useState(false);
  const [festivalName, setFestivalName] = useState('');
  const [festivalAmount, setFestivalAmount] = useState(500);
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [personalMessages, setPersonalMessages] = useState<any[]>([]);
const [communityMessages, setCommunityMessages] = useState<any[]>([]);
  // Personal Messages State
  const [viewMode, setViewMode] = useState<'community' | 'personal'>('community');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const cleanTenantId = selectedTenantId?.includes('_')
  ? selectedTenantId.split('_')[1]   // take only tenantId
  : selectedTenantId;

const chatId =
  user?.id && cleanTenantId
    ? generateChatId(user.id, cleanTenantId)
    : null;
    console.log("USER:", user?.id);
console.log("SELECTED TENANT:", selectedTenantId);
console.log("CHAT ID:", chatId);
  console.log("chatid:",chatId);
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [showTenantSuggestions, setShowTenantSuggestions] = useState(false);
  const [personalMessageInput, setPersonalMessageInput] = useState('');
  
  // Scroll state
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  
  // Ref for auto-scrolling to bottom of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  console.log("properties frontend:",properties);

  // Check if user is at bottom of chat
  const isUserAtBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    
    const threshold = 100; // pixels from bottom
    const position = container.scrollHeight - container.scrollTop - container.clientHeight;
    return position < threshold;
  };

  // Handle scroll events to show/hide scroll button
  const handleScroll = () => {
    const isAtBottom = isUserAtBottom();
    setShowScrollButton(!isAtBottom);
    
    if (isAtBottom) {
      setHasNewMessages(false);
    }
  };

  //  Auto-scroll to bottom function
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setHasNewMessages(false);
  };

  // Define selected community and chat BEFORE useEffect hooks
  const selectedCommunity = communities.find(c => c.id === selectedCommunityId) || null;
  
  const selectedTenantForCompose = selectedTenantId ? uniqueTenants.find(t => t.id === selectedTenantId) : null;
  const uniqueChats = Array.from(
  new Map(personalChats.map(chat => [chat.tenantId, chat])).values()
);

  // Auto-select first community if none selected
  useEffect(() => {
    if (!selectedCommunityId && communities.length > 0) {
      setSelectedCommunityId(communities[0].id);
    }
  }, [communities]);
 useEffect(() => {
  if (!chatId) return;

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    setPersonalMessages(data || []);
  };

  fetchMessages();
}, [chatId]);
useEffect(() => {
  if (!selectedCommunity?.propertyId) return;

  const fetchCommunityMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("property_id", selectedCommunity.propertyId)
      .order("created_at", { ascending: true });

    setCommunityMessages(data || []);
  };

  fetchCommunityMessages();
}, [selectedCommunity?.propertyId]);
useEffect(() => {
  if (!chatId) return;

  const channel = supabase
    .channel(`chat-${chatId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chatId}`
      },
      (payload)=>{
        console.log("new message:",payload);
        setPersonalMessages((perv)=>[...perv,
          payload.new
        ]);
      }
      
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [chatId]);

  // Auto-scroll to bottom on initial load and when switching views/communities
  useEffect(() => {
    // Scroll to bottom immediately when view mode or community changes
    scrollToBottom(false);
  }, [viewMode, selectedCommunityId, selectedTenantId]);

  // Auto-scroll to bottom when messages first load (initial data load)
  useEffect(() => {
    if (viewMode === 'community' && selectedCommunity) {
      const messages = selectedCommunity.messages || [];
      if (messages.length > 0) {
        // Use setTimeout to ensure DOM has updated with messages
        setTimeout(() => scrollToBottom(false), 100);
      }
    } 
  }, [
    selectedCommunity?.messages?.length,
    viewMode,
    selectedCommunityId,
    selectedTenantId
  ]);

  // Auto-scroll to bottom when messages change (only if user was already at bottom)
  useEffect(() => {
    if (isUserAtBottom()) {
      scrollToBottom(true);
    } else {
      setHasNewMessages(true);
    }
  }, [communityMessages, personalMessages]);

  const handleSendMessage = async () => {
  if (!newMessage.trim() || !selectedCommunity) return;

  const { data, error } = await supabase
    .from("messages")
    .insert([
      {
        property_id: selectedCommunity.propertyId,
        sender_id: user.id,
        message: newMessage
      }
    ])
    .select()
    .single();

  if (error) {
    console.error(error);
    return;
  }

  setCommunityMessages((prev) => [...prev, data]);
  setNewMessage('');
};

  const handleFestivalCollection = () => {
    if (!selectedCommunity || !festivalName.trim()) return;

    // Get tenants for this property
    const tenantsInProperty = tenants.filter(t => t.property === selectedCommunity.property);
    
    if (tenantsInProperty.length === 0) {
      toast.error('No Tenants Found', {
        description: 'Add tenants to this property before creating a festival payment'
      });
      return;
    }

    const perTenantAmount = Math.round(festivalAmount / tenantsInProperty.length);
    
    // Create festival payment
    createFestivalPayment(selectedCommunity.id, festivalName, festivalAmount, tenantsInProperty);
    
    // Add message to chat
    const message: Message = {
      id: `msg-${Date.now()}`,
      sender: user?.name || 'Landlord',
      senderRole: 'landlord',
      content: `${festivalName} - Festival contribution collection of ₹${perTenantAmount} per tenant`,
      timestamp: new Date().toISOString(),
      type: 'payment-request',
      paymentAmount: perTenantAmount
    };

    addMessage(selectedCommunity.id, message);

    // Show success notification
    toast.success('Festival Collection Created', {
      description: `${festivalName} payment request of ₹${perTenantAmount} per tenant has been sent to ${selectedCommunity.property} community`
    });

    setIsFestivalDialogOpen(false);
    setFestivalName('');
    setFestivalAmount(500);
  };

  const handlePaymentStatusChange = (festivalPaymentId: string, tenantId: string, newStatus: 'paid' | 'pending' | 'overdue') => {
    if (!selectedCommunity) return;
    
    updateFestivalPaymentStatus(selectedCommunity.id, festivalPaymentId, tenantId, newStatus);
    
    // Show toast notification
    const tenant = tenants.find(t => t.id === tenantId);
    const payment = selectedCommunity.festivalPayments?.find(p => p.id === festivalPaymentId);
    
    if (tenant && payment) {
      if (newStatus === 'paid') {
        toast.success('Payment Recorded', {
          description: `${tenant.name}'s ${payment.festivalName} payment of ₹${payment.perTenantAmount.toLocaleString()} has been marked as paid`
        });
      } else if (newStatus === 'pending') {
        toast.warning('Payment Pending', {
          description: `${tenant.name}'s payment has been marked as pending`
        });
      } else if (newStatus === 'overdue') {
        toast.error('Payment Overdue', {
          description: `${tenant.name}'s payment has been marked as overdue`
        });
      }
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const handleSelectTenant = (tenantId: string, tenantName: string) => {
    // DO NOT create chat here - just select the tenant for composing
    // Chat will be created only when first message is sent
    
    // Close search suggestions
    setShowTenantSuggestions(false);
     console.log("USER:", user?.id);
console.log("SELECTED TENANT:", tenantId);
    // Select the tenant
    setSelectedTenantId(tenantId.split('_').pop());
    setViewMode('personal');

    // Mark as read only if chat already exists
    const existingChat = personalChats.find(chat => chat.tenantId=== tenantId);
    if (existingChat) {
      markPersonalChatAsRead(tenantId);
    }
  };

  const handleClearSearch = () => {
    setTenantSearchQuery('');
    setShowTenantSuggestions(false);
    
    // If current selected tenant has no messages (temporary search selection),
    // clear the selection when search is cleared
    if (selectedTenantId && viewMode === 'personal') {
      const selectedChat = personalChats.find(chat => chat.tenantId === selectedTenantId);
      if (!selectedChat || selectedChat.messages.length === 0) {
        setSelectedTenantId(null);
        setViewMode('community');
      }
    }
  };

  const handleSendPersonalMessage = async () => {
  if (!personalMessageInput.trim() || !selectedTenantId) return;

  const existingChat = personalChats.find(
    chat => chat.tenantId === selectedTenantId
  );

  const tenant = tenants.find(t => t.id === selectedTenantId);

  if (!existingChat && tenant) {
    createPersonalChat(selectedTenantId, tenant.name);
  }

  if (selectedTenantId === user.id) return;

  const { data, error } = await supabase
    .from("messages")
    .insert([
      {
        chat_id: chatId,
        sender_id: user.id,
        message: personalMessageInput
      }
    ])
    .select()
    .single();

  if (error) {
    console.error(error);
    return;
  }

  setPersonalMessages(prev => [...prev, data]);
  setPersonalMessageInput('');
  if (tenant) {
      toast.success('Message Sent', {
        description: `Your message has been sent to ${tenant.name}`
      });
    }
};
    // Show toast notification
    
    
  
  
  if (!properties||properties.length=== 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Community</h2>
          <p className="text-muted-foreground">Connect with your tenants</p>
        </div>
        <Card className="p-12 bg-gradient-to-br from-primary/5 to-accent/5">
          <EmptyState
            icon={MessageCircle}
            title="No Community Created Yet"
            description="Create a community chat for your properties to communicate with tenants, share announcements, and collect festival contributions."
            actionLabel="Create Community"
            onAction={() => {
  if (!properties || properties.length === 0) {
    alert('No properties found');
    return;
  }

  const property = properties[0];

  // CREATE COMMUNITY
  const newCommunity = {
    id: `community-${Date.now()}`,
    name: property.name + ' Community',
    property: property.name,
    propertyId: property.id,
    memberCount: 1,
    messages: [],
    festivalPayments: []
  };

  // ADD TO CONTEXT (IMPORTANT)
  
}}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Community</h2>
          <p className="text-muted-foreground">Connect with your tenants and track festival payments</p>
        </div>
        <Dialog open={isFestivalDialogOpen} onOpenChange={setIsFestivalDialogOpen}>
          <DialogTrigger asChild>
            <GradientButton>
              <PartyPopper className="w-4 h-4" />
              Collect Money
            </GradientButton>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Festival Money Collection</DialogTitle>
              <DialogDescription>
                Collect money from your tenants for a festival or event.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="festival-name">Festival/Event Name</Label>
                <Input
                  id="festival-name"
                  type="text"
                  placeholder="e.g., Diwali Celebration"
                  value={festivalName}
                  onChange={(e) => setFestivalName(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              
              <div>
                <Label htmlFor="total-amount">Total Amount</Label>
                <Input
                  id="total-amount"
                  type="number"
                  placeholder="e.g., 5000"
                  value={festivalAmount}
                  onChange={(e) => setFestivalAmount(parseInt(e.target.value) || 0)}
                  className="mt-1.5"
                />
              </div>

              {selectedCommunity && tenants.filter(t => t.property === selectedCommunity.property).length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Auto-Split Calculation:</p>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Amount: ₹{festivalAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">
                    Number of Tenants: {tenants.filter(t => t.property === selectedCommunity.property).length}
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    Per Tenant: ₹{Math.round(festivalAmount / tenants.filter(t => t.property === selectedCommunity.property).length).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsFestivalDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <GradientButton onClick={handleFestivalCollection} className="flex-1" disabled={!festivalName.trim()}>
                  Send Request
                </GradientButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Communities List */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Community Sidebar */}
        <Card className="p-4 xl:col-span-1">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Your Communities
          </h3>
          <div className="space-y-2">
            {communities.map((community) => (
              <button
                key={community.id}
                onClick={() => {
                  setSelectedCommunityId(community.id);
                  setViewMode('community');
                  setSelectedTenantId(null);
                }}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedCommunity?.id === community.id && viewMode === 'community'
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-accent/5 border border-transparent'
                }`}
              >
                <p className="font-medium text-sm mb-1">{community.name}</p>
                
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* Personal Messages Section */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Personal Messages
            </h3>

            {/* Search Bar */}
            <div className="relative mb-3">
              <Input
                ref={searchInputRef}
                placeholder="Search tenants..."
                value={tenantSearchQuery}
                onChange={(e) => {
                  setTenantSearchQuery(e.target.value);
                  setShowTenantSuggestions(e.target.value.length > 0);
                }}
                onFocus={() => setShowTenantSuggestions(tenantSearchQuery.length > 0)}
                className="pl-8 text-sm"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {tenantSearchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Tenant Suggestions Dropdown */}
              {showTenantSuggestions && (
                <div className="absolute top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {uniqueTenants
                    .filter(tenant =>
                      tenant.name.toLowerCase().includes(tenantSearchQuery.toLowerCase())
                    )
                    .map(tenant => (
                      <button
                        key={tenant.id}
                        onClick={() => {
                          handleSelectTenant(tenant.id, tenant.name);
                          setTenantSearchQuery('');
                          setShowTenantSuggestions(false);
                        }}
                        className="w-full text-left p-2.5 hover:bg-accent/10 transition-colors border-b border-border last:border-0"
                      >
                        <p className="text-sm font-medium">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tenant.property} • {tenant.unit}
                        </p>
                      </button>
                    ))}
                  {uniqueTenants.filter(tenant =>
                    tenant.name.toLowerCase().includes(tenantSearchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      No tenants found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Personal Chats List */}
            <div className="space-y-1">
              
              {uniqueChats && uniqueChats.filter(chat => chat.messages.length > 0).length > 0 ? (
  uniqueChats
    .filter(chat => chat.messages.length > 0)
    .sort((a, b) =>
      new Date(b.lastMessageTimestamp).getTime() -
      new Date(a.lastMessageTimestamp).getTime()
    )
    .map(chat => (
                    <button
                      key={chat.tenantId}
                      onClick={() => {
                        setSelectedTenantId(chat.tenantId);
                        setViewMode('personal');
                        markPersonalChatAsRead(chat.tenantId);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                        selectedTenantId === chat.tenantId && viewMode === 'personal'
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-accent/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate flex-1">{chat.tenantName}</p>
                        {chat.unreadCount > 0 && (
                          <span className="flex items-center justify-center min-w-[20px] h-[20px] bg-emerald-500 text-white text-xs font-bold rounded-full px-1.5 shrink-0">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
              ) : (
                <div className="text-center py-4 px-2">
                  <p className="text-xs text-muted-foreground">
                    No conversations yet. Search for a tenant to start chatting.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Chat Area */}
        {selectedCommunity && viewMode === 'community' && (
          <Card className="xl:col-span-2 flex flex-col h-[600px] relative">
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">{selectedCommunity.name}</h3>
              
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesContainerRef} onScroll={handleScroll}>
              {communityMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] ${
                      message.sender_id === user.id
                        ? 'bg-gradient-to-r from-primary to-accent text-white'
                        : 'bg-muted text-foreground'
                    } rounded-2xl px-4 py-2.5`}
                  >
                    {!message.type||message.type === 'text' ? (
                      <>
                        <p className={`text-xs font-medium mb-1 ${
                          message.sender_id === user.id? 'text-white/90' : 'text-muted-foreground'
                        }`}>
                          {message.sender_id===user.id? 'you':'Tenant'}
                        </p>
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === user.id ? 'text-white/70' : 'text-muted-foreground'
                        }`}>
                          {formatTime(message.created_at)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-medium mb-2 text-white/90">
                          {message.sender}
                        </p>
                        <div className="bg-white/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4" />
                            <p className="font-semibold">Payment Request</p>
                          </div>
                          <p className="text-sm mb-1">{message.message}</p>
                        </div>
                        <p className="text-xs mt-2 text-white/70">
                          {formatTime(message.created_at)}
                        </p>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to Bottom Button */}
            <AnimatePresence>
              {showScrollButton && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute bottom-20 right-6 z-10"
                >
                  <Button
                    onClick={() => scrollToBottom(true)}
                    size="icon"
                    className="rounded-full shadow-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
                  >
                    {hasNewMessages ? (
                      <div className="relative">
                        <ArrowDown className="w-4 h-4" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                      </div>
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  className="bg-primary hover:bg-primary/90"
                  disabled={!newMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Personal Chat Area */}
        {selectedCommunity && viewMode === 'personal'  && selectedTenantId&&(
          <Card className="xl:col-span-2 flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedTenantForCompose?.name}</h3>
                  <p className="text-xs text-muted-foreground">Personal Chat</p>
                </div>
              </div>
            </div>

            {/* Personal Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesContainerRef} onScroll={handleScroll}>
              {personalMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm font-medium mb-1">Start a Conversation</p>
                  <p className="text-xs text-muted-foreground px-8">
                    Send a message to {selectedTenantForCompose?.name} to begin your private conversation
                  </p>
                </div>
              ) : (
                <>
                  {personalMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          message.sender_id === user.id
                            ? 'bg-gradient-to-r from-primary to-accent text-white'
                            : 'bg-muted text-foreground'
                        } rounded-2xl px-4 py-2.5`}
                      >
                        <p className={`text-xs font-medium mb-1 ${
  message.sender_id === user.id ? 'text-white/90' : 'text-muted-foreground'
}`}>
  {message.sender_id === user.id ? 'You' : selectedTenantForCompose?.name}
</p>
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === user.id ? 'text-white/70' : 'text-muted-foreground'
                        }`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder={`Message ${selectedTenantForCompose?.name}...`}
                  value={personalMessageInput}
                  onChange={(e) => setPersonalMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendPersonalMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendPersonalMessage}
                  className="bg-primary hover:bg-primary/90"
                  disabled={!personalMessageInput.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Compose Mode - When tenant is selected from search but no chat exists yet */}
       

        {/* Festival Payments Panel - GPAY STYLE */}
        {selectedCommunity && (
          <Card className="xl:col-span-1 p-4 h-[600px] overflow-y-auto">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-primary" />
              Festival Payments
            </h3>
            
            {selectedCommunity.festivalPayments && selectedCommunity.festivalPayments.length > 0 ? (
              <div className="space-y-3">
                {selectedCommunity.festivalPayments.map((payment) => {
                  const isExpanded = expandedPaymentId === payment.id;
                  const paidCount = payment.tenantPayments.filter(tp => tp.status === 'paid').length;
                  const totalCount = payment.tenantPayments.length;
                  const totalCollected = payment.tenantPayments
                    .filter(tp => tp.status === 'paid')
                    .reduce((sum, tp) => sum + tp.amount, 0);

                  return (
                    <div key={payment.id} className="border border-border rounded-lg overflow-hidden">
                      {/* Payment Header - Collapsible */}
                      <button
                        onClick={() => setExpandedPaymentId(isExpanded ? null : payment.id)}
                        className="w-full p-3 bg-accent/30 hover:bg-accent/40 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-sm">{payment.festivalName}</p>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Total: ₹{payment.totalAmount.toLocaleString()} • Per Tenant: ₹{payment.perTenantAmount.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-border rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                              style={{ width: `${(paidCount / totalCount) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-primary">
                            {paidCount}/{totalCount}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Collected: ₹{totalCollected.toLocaleString()}
                        </p>
                      </button>

                      {/* Tenant Payment List - GPay Style */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="divide-y divide-border">
                              {payment.tenantPayments.map((tenantPayment) => (
                                <div key={tenantPayment.tenantId} className="p-3 hover:bg-accent/5 transition-colors">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{tenantPayment.tenantName}</p>
                                      <p className="text-xs text-primary font-semibold mt-0.5">
                                        ₹{tenantPayment.amount.toLocaleString()}
                                      </p>
                                    </div>
                                    
                                    {/* Status Dropdown */}
                                    <div className="relative">
                                      <select
                                        value={tenantPayment.status}
                                        onChange={(e) => handlePaymentStatusChange(
                                          payment.id,
                                          tenantPayment.tenantId,
                                          e.target.value as 'paid' | 'pending' | 'overdue'
                                        )}
                                        className={`appearance-none text-xs font-medium px-2 py-1 pr-6 rounded-md border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                          tenantPayment.status === 'paid'
                                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                                            : tenantPayment.status === 'pending'
                                            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                                            : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                                        }`}
                                      >
                                        <option value="paid">Paid</option>
                                        <option value="pending">Pending</option>
                                        <option value="overdue">Overdue</option>
                                      </select>
                                      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60" />
                                    </div>
                                  </div>
                                  
                                  {/* Status Icon */}
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    {tenantPayment.status === 'paid' && (
                                      <>
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                        <span className="text-xs text-muted-foreground">
                                          {tenantPayment.paidDate && `Paid on ${new Date(tenantPayment.paidDate).toLocaleDateString()}`}
                                        </span>
                                      </>
                                    )}
                                    {tenantPayment.status === 'pending' && (
                                      <>
                                        <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                        <span className="text-xs text-amber-600 dark:text-amber-400">
                                          Payment pending
                                        </span>
                                      </>
                                    )}
                                    {tenantPayment.status === 'overdue' && (
                                      <>
                                        <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                                        <span className="text-xs text-red-600 dark:text-red-400">
                                          Payment overdue
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <PartyPopper className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">No Festival Payments</p>
                <p className="text-xs text-muted-foreground">
                  Create a festival collection to see payment tracking here
                </p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}