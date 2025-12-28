import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useChats, Chat } from '@/hooks/useChat';
import ChatList from '@/components/chat/ChatList';
import ChatView from '@/components/chat/ChatView';
import WellbeingWidget from '@/components/wellbeing/WellbeingWidget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  Search,
  Settings,
  LogOut,
  Plus,
  MessageCircle,
  Shield,
  Moon,
  Sun,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ChatDashboard: React.FC = () => {
  const { user, userProfile, logout } = useAuth();
  const { chats, loading, createChat, createGroupChat } = useChats();
  const { toast } = useToast();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatEmail, setNewChatEmail] = useState('');
  const [creating, setCreating] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Signed out",
        description: "See you soon! Take care.",
      });
    } catch (error) {
      toast({
        title: "Couldn't sign out",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartNewChat = async () => {
    if (!newChatEmail.trim()) return;
    
    setCreating(true);
    try {
      // In a real app, you'd search for users by email
      // For now, we'll create a chat with a placeholder
      const chatId = await createChat(newChatEmail, newChatEmail);
      
      if (chatId) {
        setShowNewChat(false);
        setNewChatEmail('');
        toast({
          title: "Chat created",
          description: "You can now start messaging.",
        });
      }
    } catch (error) {
      toast({
        title: "Couldn't start chat",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    if (chat.isGroup) {
      return chat.groupName?.toLowerCase().includes(searchLower);
    }
    
    return Object.values(chat.participantNames).some((name) =>
      name.toLowerCase().includes(searchLower)
    );
  });

  const getChatDisplayName = (chat: Chat): string => {
    if (chat.isGroup) return chat.groupName || 'Group Chat';
    const otherParticipantId = chat.participants.find((p) => p !== user?.uid);
    return otherParticipantId ? chat.participantNames[otherParticipantId] : 'Unknown';
  };

  // Mobile view: show either list or chat
  const showMobileChat = selectedChat !== null;

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`w-full md:w-80 lg:w-96 border-r bg-sidebar flex flex-col ${
          showMobileChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-calm flex items-center justify-center">
                <Users className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">Serene</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={userProfile?.photoURL || undefined} />
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      {userProfile?.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="font-medium text-foreground">{userProfile?.displayName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Shield className="h-4 w-4 mr-2" />
                  Safety Mode {userProfile?.safetyMode ? 'On' : 'Off'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-0"
            />
          </div>
        </div>
        
        {/* Wellbeing widget */}
        <div className="p-4 border-b">
          <WellbeingWidget />
        </div>
        
        {/* Chat list */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ChatList
              chats={filteredChats}
              selectedChatId={selectedChat?.id || null}
              onSelectChat={setSelectedChat}
            />
          )}
        </div>
        
        {/* New chat button */}
        <div className="p-4 border-t">
          <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
            <DialogTrigger asChild>
              <Button className="w-full gradient-calm">
                <Plus className="h-4 w-4 mr-2" />
                New Conversation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start a New Conversation</DialogTitle>
                <DialogDescription>
                  Enter the user ID of the person you want to chat with.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">User ID</label>
                  <Input
                    placeholder="Enter user ID..."
                    value={newChatEmail}
                    onChange={(e) => setNewChatEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ask your friend for their user ID to start chatting.
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={handleStartNewChat}
                  disabled={!newChatEmail.trim() || creating}
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Start Chat
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Chat area */}
      <div className={`flex-1 ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        {selectedChat ? (
          <ChatView
            chatId={selectedChat.id}
            chatName={getChatDisplayName(selectedChat)}
            isGroup={selectedChat.isGroup}
            onBack={() => setSelectedChat(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-24 w-24 rounded-2xl bg-accent flex items-center justify-center mb-6"
            >
              <MessageCircle className="h-12 w-12 text-accent-foreground" />
            </motion.div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Serene</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Select a conversation to start chatting, or create a new one. 
              Remember to take breaks and be kind to yourself and others.
            </p>
            <Button onClick={() => setShowNewChat(true)} className="gradient-calm">
              <Plus className="h-4 w-4 mr-2" />
              Start a Conversation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatDashboard;
