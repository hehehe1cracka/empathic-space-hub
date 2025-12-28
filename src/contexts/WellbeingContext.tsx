import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ref, set } from 'firebase/database';
import { getFirebaseDatabase } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface WellbeingContextType {
  sessionStartTime: number | null;
  todayUsage: number; // in minutes
  dailyLimit: number; // in minutes
  isLimitReached: boolean;
  showBreakReminder: boolean;
  dismissBreakReminder: () => void;
  resetDailyUsage: () => void;
}

const WellbeingContext = createContext<WellbeingContextType | undefined>(undefined);

export const useWellbeing = () => {
  const context = useContext(WellbeingContext);
  if (!context) {
    throw new Error('useWellbeing must be used within a WellbeingProvider');
  }
  return context;
};

export const WellbeingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile, isConfigured } = useAuth();
  const { toast } = useToast();
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [todayUsage, setTodayUsage] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(120);
  const [showBreakReminder, setShowBreakReminder] = useState(false);
  const [lastBreakReminder, setLastBreakReminder] = useState(0);

  // Track session time
  useEffect(() => {
    if (user && isConfigured) {
      const database = getFirebaseDatabase();

      setSessionStartTime(Date.now());

      // Update usage every minute
      const interval = setInterval(() => {
        setTodayUsage((prev) => {
          const newUsage = prev + 1;

          // Save to database
          const usageRef = ref(database, `users/${user.uid}/todayUsage`);
          set(usageRef, newUsage);

          return newUsage;
        });
      }, 60000); // Every minute

      return () => clearInterval(interval);
    }
  }, [user, isConfigured]);

  // Load user preferences
  useEffect(() => {
    if (userProfile) {
      setTodayUsage(userProfile.todayUsage || 0);
      setDailyLimit(userProfile.dailyUsageLimit || 120);
    }
  }, [userProfile]);

  // Check for break reminders (every 30 minutes of continuous use)
  useEffect(() => {
    if (sessionStartTime && isConfigured) {
      const checkInterval = setInterval(() => {
        const sessionDuration = (Date.now() - sessionStartTime) / 60000; // in minutes
        const timeSinceLastReminder = (Date.now() - lastBreakReminder) / 60000;

        if (sessionDuration >= 30 && timeSinceLastReminder >= 30) {
          setShowBreakReminder(true);
          setLastBreakReminder(Date.now());

          toast({
            title: 'Time for a break! 🌿',
            description:
              "You've been chatting for 30 minutes. Consider taking a short break to stretch or breathe.",
            duration: 10000,
          });
        }
      }, 60000);

      return () => clearInterval(checkInterval);
    }
  }, [sessionStartTime, lastBreakReminder, isConfigured, toast]);

  // Check if daily limit is reached
  const isLimitReached = todayUsage >= dailyLimit;

  useEffect(() => {
    if (isLimitReached && isConfigured) {
      toast({
        title: 'Daily limit reached',
        description: "You've reached your daily usage limit. Consider taking a break until tomorrow.",
        variant: 'destructive',
        duration: 15000,
      });
    }
  }, [isLimitReached, isConfigured, toast]);

  const dismissBreakReminder = useCallback(() => {
    setShowBreakReminder(false);
  }, []);

  const resetDailyUsage = useCallback(async () => {
    if (user && isConfigured) {
      const database = getFirebaseDatabase();

      setTodayUsage(0);
      const usageRef = ref(database, `users/${user.uid}/todayUsage`);
      await set(usageRef, 0);
    }
  }, [user, isConfigured]);

  return (
    <WellbeingContext.Provider
      value={{
        sessionStartTime,
        todayUsage,
        dailyLimit,
        isLimitReached,
        showBreakReminder,
        dismissBreakReminder,
        resetDailyUsage,
      }}
    >
      {children}
    </WellbeingContext.Provider>
  );
};
