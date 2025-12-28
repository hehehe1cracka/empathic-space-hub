import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import { useChat, Message } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { getSupportiveResponse } from '@/lib/ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  Smile,
  MoreVertical,
  Phone,
  Video,
  ArrowLeft,
  Trash2,
  Heart,
  Frown,
  Angry,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatViewProps {
  chatId: string;
  chatName: string;
  chatPhoto?: string;
  isGroup: boolean;
  onBack?: () => void;
}

const emotionIcons: Record<string, React.ReactNode> = {
  happy: <Heart className="h-3 w-3 text-success" />,
  sad: <Frown className="h-3 w-3 text-primary" />,
  angry: <Angry className="h-3 w-3 text-destructive" />,
  stressed: <AlertTriangle className="h-3 w-3 text-warning" />,
  anxious: <AlertTriangle className="h-3 w-3 text-warning" />,
};

const formatMessageTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  if (isToday(date)) {
    return format(date, 'HH:mm');
  } else if (isYesterday(date)) {
    return 'Yesterday ' + format(date, 'HH:mm');
  }
  return format(date, 'MMM d, HH:mm');
};

const TypingIndicator: React.FC = () => (
  <div className="flex items-center gap-1 text-muted-foreground">
    <span className="typing-dot h-2 w-2 rounded-full bg-status-typing" />
    <span className="typing-dot h-2 w-2 rounded-full bg-status-typing" />
    <span className="typing-dot h-2 w-2 rounded-full bg-status-typing" />
  </div>
);

const ChatView: React.FC<ChatViewProps> = ({
  chatId,
  chatName,
  chatPhoto,
  isGroup,
  onBack,
}) => {
  const { user } = useAuth();
  const { messages, loading, isTyping, sendMessage, deleteMessage, setTypingStatus } = useChat(chatId);
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [supportMessage, setSupportMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Set typing status
    setTypingStatus(true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to clear typing status
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(false);
    }, 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    try {
      const emotion = await sendMessage(newMessage);
      setNewMessage('');
      
      // Show supportive message if needed
      if (emotion && emotion !== 'neutral' && emotion !== 'happy') {
        const support = getSupportiveResponse(emotion);
        if (support) {
          setSupportMessage(support);
          setTimeout(() => setSupportMessage(null), 10000);
        }
      }
    } catch (error: any) {
      toast({
        title: "Couldn't send message",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      toast({
        title: "Message deleted",
        description: "The message has been removed.",
      });
    } catch (error) {
      toast({
        title: "Couldn't delete message",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const typingUsers = Object.keys(isTyping);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shadow-soft">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        
        <Avatar className="h-10 w-10">
          <AvatarImage src={chatPhoto} />
          <AvatarFallback className="bg-accent text-accent-foreground">
            {chatName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate">{chatName}</h2>
          {typingUsers.length > 0 ? (
            <p className="text-xs text-status-typing flex items-center gap-1">
              <TypingIndicator />
              <span>typing...</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {isGroup ? 'Group chat' : 'Online'}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Video className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Profile</DropdownMenuItem>
              <DropdownMenuItem>Search Messages</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Block User</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center mb-4">
              <Smile className="h-8 w-8 text-accent-foreground" />
            </div>
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {messages.map((message, index) => {
                const isSent = message.senderId === user?.uid;
                const showSender = !isSent && isGroup && 
                  (index === 0 || messages[index - 1].senderId !== message.senderId);
                
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] group ${isSent ? 'items-end' : 'items-start'}`}>
                      {showSender && (
                        <p className="text-xs text-muted-foreground ml-3 mb-1">
                          {message.senderName}
                        </p>
                      )}
                      
                      <div className="flex items-end gap-2">
                        {!isSent && (
                          <Avatar className="h-6 w-6 mb-1">
                            <AvatarFallback className="text-xs bg-accent">
                              {message.senderName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div
                          className={`relative px-4 py-2 rounded-2xl ${
                            isSent
                              ? 'bg-chat-sent rounded-br-md'
                              : 'bg-chat-received shadow-soft rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                            {message.text}
                          </p>
                          
                          <div className={`flex items-center gap-1.5 mt-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
                            {message.emotion && emotionIcons[message.emotion] && (
                              <span className="opacity-70">{emotionIcons[message.emotion]}</span>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                              {formatMessageTime(message.timestamp)}
                            </span>
                          </div>
                        </div>
                        
                        {isSent && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleDeleteMessage(message.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete for me
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* Support message */}
      <AnimatePresence>
        {supportMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mx-4 mb-2 p-3 rounded-lg bg-chat-system border border-border"
          >
            <div className="flex items-start gap-2">
              <Heart className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">{supportMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-4 border-t bg-card">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" className="text-muted-foreground shrink-0">
            <Smile className="h-5 w-5" />
          </Button>
          
          <Input
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 bg-muted border-0"
          />
          
          <Button
            type="submit"
            size="icon"
            disabled={!newMessage.trim() || sending}
            className="shrink-0 gradient-calm"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;
