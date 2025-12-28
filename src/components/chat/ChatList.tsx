import React from 'react';
import { motion } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { Chat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Users, MessageCircle } from 'lucide-react';

interface ChatListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chat: Chat) => void;
}

const formatLastMessageTime = (timestamp: number | undefined): string => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  if (isToday(date)) {
    return format(date, 'HH:mm');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'MMM d');
};

const ChatList: React.FC<ChatListProps> = ({ chats, selectedChatId, onSelectChat }) => {
  const { user } = useAuth();

  const getChatDisplayInfo = (chat: Chat) => {
    if (chat.isGroup) {
      return {
        name: chat.groupName || 'Group Chat',
        initial: chat.groupName?.charAt(0).toUpperCase() || 'G',
        photo: undefined,
      };
    }
    
    // For one-to-one chats, show the other participant
    const otherParticipantId = chat.participants.find((p) => p !== user?.uid);
    const otherParticipantName = otherParticipantId 
      ? chat.participantNames[otherParticipantId] 
      : 'Unknown';
    
    return {
      name: otherParticipantName,
      initial: otherParticipantName.charAt(0).toUpperCase(),
      photo: undefined,
    };
  };

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center mb-4">
          <MessageCircle className="h-8 w-8 text-accent-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">No conversations yet</h3>
        <p className="text-sm text-muted-foreground">
          Start chatting with someone to see your conversations here.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {chats.map((chat, index) => {
          const { name, initial, photo } = getChatDisplayInfo(chat);
          const isSelected = selectedChatId === chat.id;
          
          return (
            <motion.button
              key={chat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectChat(chat)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                isSelected
                  ? 'bg-accent'
                  : 'hover:bg-muted'
              }`}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={photo} />
                  <AvatarFallback className={`${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {chat.isGroup ? <Users className="h-5 w-5" /> : initial}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                {!chat.isGroup && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-status-online border-2 border-background" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-medium truncate ${
                    isSelected ? 'text-accent-foreground' : 'text-foreground'
                  }`}>
                    {name}
                  </h3>
                  {chat.lastMessageTime && (
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {formatLastMessageTime(chat.lastMessageTime)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <p className={`text-sm truncate ${
                    isSelected ? 'text-accent-foreground/80' : 'text-muted-foreground'
                  }`}>
                    {chat.lastMessage || 'No messages yet'}
                  </p>
                  
                  {chat.isGroup && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                      Group
                    </Badge>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default ChatList;
