import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { useCommunity } from '../../contexts/CommunityContext';
import { useAppData } from '../../contexts/AppDataContext';
import { MessageCircle, Send, Users, PartyPopper, Building2, Mail, AlertCircle, User, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';

interface Message {
  id: string;
  sender: string;
  senderRole: 'landlord' | 'tenant';
  content: string;
  timestamp: string;
  type: 'text' | 'payment-request';
  paymentAmount?: number;
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
type ViewMode = 'community' | 'personal';

export function TenantCommunityView({tenantData}:any) { 
  const { user } = useAuth();
  const { 
  communities, 
  addMessage, 
  loading,
  personalChats,
  addPersonalMessage,
  createPersonalChat
} = useCommunity();
  const { appData } = useAppData();
  const chatId =
  user?.id && tenantData?.landlordId
    ? generateChatId(user.id, tenantData.landlordId)
    : null;
    console.log("chatid:",chatId);
  console.log("full tenantData:",tenantData);
  const [communityMessages, setCommunityMessages] = useState<any[]>([]);
const [personalMessages, setPersonalMessages] = useState<any[]>([]);
  
  const [viewMode, setViewMode] = useState<ViewMode>('community');
  const [newMessage, setNewMessage] = useState('');
 
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  
  // Ref for auto-scrolling to bottom of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // TENANT DATA - MUST come from authenticated session / backend
  // In production: fetch from user.propertyId or tenant profile API
  // ============================================================================
  
  // Get tenant's property assignment from authenticated user
  const tenantCommunity = communities.find(
  c => c.propertyId === tenantData?.propertyId
);
console.log("tenantData.propertyId", tenantData.propertyId);
console.log("communities", communities);
  // Tenant data from authenticated user
  const personalChat = personalChats.find(
  chat => chat.id === chatId
);
  

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

  // Auto-scroll to bottom function
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setHasNewMessages(false);
  };

  // Auto-scroll to bottom on initial load and view mode change
  useEffect(() => {
    // Scroll to bottom immediately when component mounts or view mode changes
    scrollToBottom(false);
  }, [viewMode]);
useEffect(() => {
  if (!tenantData?.propertyId) return;

  const fetchCommunityMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("property_id", tenantData.propertyId)
      .order("created_at", { ascending: true });

    setCommunityMessages(data || []);
  };

  fetchCommunityMessages();
}, [tenantData?.propertyId]);
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
      (payload) => {
        console.log("tenant received:", payload);

        setPersonalMessages((prev) => [
          ...prev,
          payload.new
        ]);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [chatId]);
useEffect(() => {
  if (!chatId) return;

  const fetchPersonalMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    setPersonalMessages(data || []);
  };

  fetchPersonalMessages();
}, [chatId]);
  // Auto-scroll to bottom when messages first load (initial data load)
  useEffect(() => {
    const activeMessages =
  viewMode === 'community'
    ? communityMessages
    : personalMessages;

    if (activeMessages.length > 0) {
      // Use setTimeout to ensure DOM has updated with messages
      setTimeout(() => scrollToBottom(false), 100);
    }
  }, [communityMessages.length, personalMessages.length, viewMode]);

  // Auto-scroll to bottom when messages change (only if user was already at bottom)
  useEffect(() => {
    if (isUserAtBottom()) {
      scrollToBottom(true);
    } else {
      setHasNewMessages(true);
    }
  }, [communityMessages, personalMessages]);

  
  console.log('[TENANT COMMUNITY] Backend data sync:', {
  userPropertyId: tenantData?.propertyId,
  userPropertyName: tenantData?.propertyName,
  foundCommunityId: tenantCommunity?.id,
  foundCommunityName: tenantCommunity?.name,
  memberCount: tenantCommunity?.memberCount,
  messagesCount: tenantCommunity?.messages?.length,
  allCommunities: communities.length,
});

  // ============================================================================
  // REAL-TIME WEBSOCKET SETUP
  // Room: property_{propertyId}
  // Both landlord and tenant join same room for instant message sync
  // ============================================================================
  
  // In real app with Socket.IO:
  // useEffect(() => {
  //   if (tenantCommunity) {
  //     // Join property room: property_{propertyId}
  //     socket.emit("join_room", `property_${tenantCommunity.id}`);
  //     
  //     // Listen for incoming messages
  //     socket.on("receive_message", (data) => {
  //       // Update chat UI with new message
  //       addMessage(tenantCommunity.id, data.message);
  //     });
  //     
  //     return () => {
  //       socket.off("receive_message");
  //       socket.emit("leave_room", `property_${tenantCommunity.id}`);
  //     };
  //   }
  // }, [tenantCommunity?.id]);

  // ============================================================================
  // INITIALIZE PRIVATE CHAT - Auto-create welcome message
  // Room: private_landlord_{landlordId}_tenant_{tenantId}
  // ============================================================================
  
  

  // ============================================================================
  // MESSAGE HANDLING - Real-time sync via context
  // ============================================================================
  
 const handleSendMessage = async () => {
  if (!newMessage.trim()) return;

  // ================= COMMUNITY =================
  if (viewMode === 'community') {
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          property_id: tenantData.propertyId,
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

    if (data) {
      setCommunityMessages((prev) => [...prev, data]);
    }

  } 
  // ================= PERSONAL =================
  else {

    // 👉 ADD THIS EXACTLY HERE
    if (!chatId) {
      console.error("chatId missing");
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          chat_id: chatId,
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
setPersonalMessages((perv)=>[...perv,data]);
    
  }

  setNewMessage('');
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

  // ============================================================================
  // RENDER MAIN UI - Always renders (property exists from dashboard)
  // ============================================================================
  
  const activeMessages = viewMode === 'community' 
    ?communityMessages:personalMessages;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Community</h2>
        <p className="text-muted-foreground">Connect with your landlord and community</p>
      </div>

      {/* 3-Column Layout - Mirrors Landlord Community Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* ========================================================================
            LEFT SIDEBAR - Mirrors Landlord Layout
        ======================================================================== */}
        <Card className="p-4 xl:col-span-1">
          {/* Your Communities Section */}
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Your Communities
          </h3>
          <div className="space-y-2">
            {/* Single Property Community (Tenant's Assigned Property) */}
            <button
              onClick={() => setViewMode('community')}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                viewMode === 'community'
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-accent/5 border border-transparent'
              }`}
            >
              <p className="font-medium text-sm mb-1">{tenantCommunity?.name || `${tenantData.propertyName} Community`}</p>
              
            </button>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* Direct Messages Section */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Direct Messages
            </h3>

            {/* Landlord Private Chat */}
            <div className="space-y-1">
              <button
                onClick={() => setViewMode('personal')}
                className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                  viewMode === 'personal'
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-accent/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">Landlord – {tenantData.landlordName}</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </Card>

        {/* ========================================================================
            CENTER PANEL - Chat Interface
        ======================================================================== */}
        <Card className="xl:col-span-2 flex flex-col h-[600px] relative">
          {/* Chat Header */}
          <div className="p-4 border-b border-border">
            {viewMode === 'community' ? (
              <>
                <h3 className="font-semibold">{tenantCommunity?.name || `${tenantData.propertyName} Community`}</h3>
                
                <p className="text-xs font-medium text-primary mt-2 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Landlord: {tenantData.landlordName}
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{tenantData.landlordName}</h3>
                    <p className="text-xs text-muted-foreground">Private Chat</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesContainerRef} onScroll={handleScroll}>
            {activeMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm font-medium mb-1">No Messages Yet</p>
                <p className="text-xs text-muted-foreground px-8">
                  {viewMode === 'community' 
                    ? 'Start the conversation with your community'
                    : 'Start a private conversation with your landlord'}
                </p>
              </div>
            ) : (
              <>
                <AnimatePresence>
                  {activeMessages.filter((msg)=>msg && msg.sender_id).map((message) => (
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
                        {viewMode === 'community' &&  message.type === 'payment-request' ? (
                          <>
                            <p className="text-xs font-medium mb-2 text-white/90">
                              {message.sender}
                            </p>
                            <div className="bg-white/20 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <PartyPopper className="w-4 h-4" />
                                <p className="font-semibold">Payment Request</p>
                              </div>
                              <p className="text-sm mb-1">{message.message}</p>
                              {message.paymentAmount && (
                                <p className="text-sm font-bold mt-2">
                                  Amount: ₹{message.paymentAmount.toLocaleString()}
                                </p>
                              )}
                            </div>
                            <p className="text-xs mt-2 text-white/70">
                              {formatTime(message.created_at)}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className={`text-xs font-medium mb-1 ${
                              message.sender_id === user.id ? 'text-white/90' : 'text-muted-foreground'
                            }`}>
                              {message.sender}
                            </p>
                            <p className="text-sm">{message.message}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender_id === user.id ? 'text-white/70' : 'text-muted-foreground'
                            }`}>
                              {formatTime(message.created_at)}
                            </p>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </>
            )}
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
                placeholder={viewMode === 'community' ? 'Type a message...' : `Message ${tenantData.landlordName}...`}
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

        {/* ========================================================================
            RIGHT PANEL - Property/Landlord Information
        ======================================================================== */}
        <Card className="xl:col-span-1 p-4 h-[600px] overflow-y-auto">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {viewMode === 'community' ? 'Community Information' : 'Landlord Information'}
          </h3>
          
          <div className="space-y-4">
            {/* Property Name */}
            <div className="p-3 bg-primary/5 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Property</p>
              <p className="font-medium text-sm">{tenantData.propertyName}</p>
            </div>

            {/* Unit Number */}
            <div className="p-3 bg-accent/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Your Unit</p>
              <p className="font-medium text-sm">Unit {tenantData.unitName}</p>
            </div>

            {/* Landlord Info */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Landlord</p>
              </div>
              <p className="text-sm font-medium">{tenantData.landlordName}</p>
            </div>

            {/* Contact */}
            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="w-3 h-3 text-blue-500" />
                <p className="text-xs text-blue-500 font-medium">Contact</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {viewMode === 'personal' ? 'Private chat active' : 'Use direct messages for private matters'}
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-border my-4" />

            {/* Important Notices */}
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                Important Notices
              </h4>
              
              <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {viewMode === 'community' 
                    ? 'Check the community chat regularly for important updates from your landlord.'
                    : 'Use this private channel for personal matters with your landlord. Messages are confidential.'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
