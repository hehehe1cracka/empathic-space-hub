import { useState, useEffect, useCallback } from 'react';
import {
  ref,
  push,
  set,
  onValue,
  off,
  serverTimestamp,
  query,
  orderByChild,
  limitToLast,
  remove,
} from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { analyzeEmotion, detectToxicity } from '@/lib/ai';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'stressed' | 'anxious';
  isToxic?: boolean;
  isDeleted?: boolean;
  deletedAt?: number;
}

export interface Chat {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  lastMessage?: string;
  lastMessageTime?: number;
  isGroup: boolean;
  groupName?: string;
  createdAt: number;
}

export const useChat = (chatId: string | null) => {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});

  // Listen to messages
  useEffect(() => {
    if (!chatId || !user) {
      setLoading(false);
      return;
    }

    const messagesRef = query(
      ref(database, `chats/${chatId}/messages`),
      orderByChild('timestamp'),
      limitToLast(100)
    );

    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messageList = Object.entries(data).map(([id, msg]: [string, any]) => ({
          id,
          ...msg,
        }));
        setMessages(messageList.filter((m) => !m.isDeleted));
      } else {
        setMessages([]);
      }
      setLoading(false);
    });

    // Listen to typing status
    const typingRef = ref(database, `chats/${chatId}/typing`);
    onValue(typingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Filter out current user's typing status
        const typingUsers = Object.entries(data)
          .filter(([uid, isTyping]: [string, any]) => uid !== user.uid && isTyping)
          .reduce((acc, [uid, val]) => ({ ...acc, [uid]: val }), {});
        setIsTyping(typingUsers);
      } else {
        setIsTyping({});
      }
    });

    return () => {
      off(messagesRef);
      off(typingRef);
    };
  }, [chatId, user]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!chatId || !user || !userProfile || !text.trim()) return;

      // Analyze message for toxicity
      const toxicityResult = await detectToxicity(text);
      
      if (toxicityResult.isToxic) {
        throw new Error('This message contains harmful content. Please rephrase it kindly.');
      }

      // Analyze emotion
      const emotion = await analyzeEmotion(text);

      const messagesRef = ref(database, `chats/${chatId}/messages`);
      const newMessageRef = push(messagesRef);
      
      const message: Omit<Message, 'id'> = {
        senderId: user.uid,
        senderName: userProfile.displayName || 'User',
        text: text.trim(),
        timestamp: Date.now(),
        emotion,
        isToxic: false,
      };

      await set(newMessageRef, message);

      // Update chat last message
      const chatLastMsgRef = ref(database, `chats/${chatId}/lastMessage`);
      const chatLastTimeRef = ref(database, `chats/${chatId}/lastMessageTime`);
      await set(chatLastMsgRef, text.trim().substring(0, 50));
      await set(chatLastTimeRef, Date.now());

      // Clear typing indicator
      await setTypingStatus(false);

      return emotion;
    },
    [chatId, user, userProfile]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!chatId || !user) return;

      const messageDeletedRef = ref(database, `chats/${chatId}/messages/${messageId}/isDeleted`);
      const messageDeletedAtRef = ref(database, `chats/${chatId}/messages/${messageId}/deletedAt`);
      await set(messageDeletedRef, true);
      await set(messageDeletedAtRef, Date.now());
    },
    [chatId, user]
  );

  const setTypingStatus = useCallback(
    async (typing: boolean) => {
      if (!chatId || !user) return;

      const typingRef = ref(database, `chats/${chatId}/typing/${user.uid}`);
      await set(typingRef, typing);
    },
    [chatId, user]
  );

  return {
    messages,
    loading,
    isTyping,
    sendMessage,
    deleteMessage,
    setTypingStatus,
  };
};

export const useChats = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const userChatsRef = ref(database, `userChats/${user.uid}`);
    
    onValue(userChatsRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const chatIds = Object.keys(data);
        const chatPromises = chatIds.map(async (chatId) => {
          const chatRef = ref(database, `chats/${chatId}`);
          return new Promise<Chat | null>((resolve) => {
            onValue(chatRef, (chatSnapshot) => {
              if (chatSnapshot.exists()) {
                resolve({ id: chatId, ...chatSnapshot.val() } as Chat);
              } else {
                resolve(null);
              }
            }, { onlyOnce: true });
          });
        });

        const chatList = (await Promise.all(chatPromises)).filter(Boolean) as Chat[];
        setChats(chatList.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0)));
      } else {
        setChats([]);
      }
      setLoading(false);
    });

    return () => off(userChatsRef);
  }, [user]);

  const createChat = useCallback(
    async (participantId: string, participantName: string) => {
      if (!user) return null;

      // Check if chat already exists
      const existingChat = chats.find(
        (chat) =>
          !chat.isGroup &&
          chat.participants.includes(participantId) &&
          chat.participants.includes(user.uid)
      );

      if (existingChat) return existingChat.id;

      // Create new chat
      const chatsRef = ref(database, 'chats');
      const newChatRef = push(chatsRef);
      const chatId = newChatRef.key!;

      const chat: Omit<Chat, 'id'> = {
        participants: [user.uid, participantId],
        participantNames: {
          [user.uid]: user.displayName || 'User',
          [participantId]: participantName,
        },
        isGroup: false,
        createdAt: Date.now(),
      };

      await set(newChatRef, chat);

      // Add to both users' chat lists
      await set(ref(database, `userChats/${user.uid}/${chatId}`), true);
      await set(ref(database, `userChats/${participantId}/${chatId}`), true);

      return chatId;
    },
    [user, chats]
  );

  const createGroupChat = useCallback(
    async (participantIds: string[], groupName: string, participantNames: Record<string, string>) => {
      if (!user) return null;

      const chatsRef = ref(database, 'chats');
      const newChatRef = push(chatsRef);
      const chatId = newChatRef.key!;

      const allParticipants = [user.uid, ...participantIds];
      const allNames = {
        [user.uid]: user.displayName || 'User',
        ...participantNames,
      };

      const chat: Omit<Chat, 'id'> = {
        participants: allParticipants,
        participantNames: allNames,
        isGroup: true,
        groupName,
        createdAt: Date.now(),
      };

      await set(newChatRef, chat);

      // Add to all users' chat lists
      for (const participantId of allParticipants) {
        await set(ref(database, `userChats/${participantId}/${chatId}`), true);
      }

      return chatId;
    },
    [user]
  );

  return {
    chats,
    loading,
    createChat,
    createGroupChat,
  };
};
