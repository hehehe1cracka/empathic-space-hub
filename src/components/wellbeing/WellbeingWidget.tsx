import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWellbeing } from '@/contexts/WellbeingContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Clock, Leaf, Wind, X } from 'lucide-react';

const BreathingExercise: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [count, setCount] = useState(4);
  const [cycle, setCycle] = useState(1);
  const totalCycles = 3;

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          // Move to next phase
          if (phase === 'inhale') {
            setPhase('hold');
            return 7;
          } else if (phase === 'hold') {
            setPhase('exhale');
            return 8;
          } else {
            if (cycle >= totalCycles) {
              onClose();
              return 0;
            }
            setCycle((c) => c + 1);
            setPhase('inhale');
            return 4;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, cycle, onClose]);

  const phaseText = {
    inhale: 'Breathe in...',
    hold: 'Hold...',
    exhale: 'Breathe out...',
  };

  const phaseColors = {
    inhale: 'from-primary/20 to-primary/40',
    hold: 'from-warning/20 to-warning/40',
    exhale: 'from-success/20 to-success/40',
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <p className="text-sm text-muted-foreground mb-4">
        Cycle {cycle} of {totalCycles}
      </p>
      
      <motion.div
        animate={{
          scale: phase === 'inhale' ? 1.2 : phase === 'hold' ? 1.2 : 1,
        }}
        transition={{ duration: phase === 'inhale' ? 4 : phase === 'hold' ? 0.5 : 8, ease: 'easeInOut' }}
        className={`h-40 w-40 rounded-full bg-gradient-to-br ${phaseColors[phase]} flex items-center justify-center mb-6`}
      >
        <div className="h-32 w-32 rounded-full bg-card flex items-center justify-center">
          <span className="text-4xl font-bold text-foreground">{count}</span>
        </div>
      </motion.div>
      
      <p className="text-xl font-medium text-foreground mb-2">{phaseText[phase]}</p>
      <p className="text-sm text-muted-foreground">
        {phase === 'inhale' && 'Fill your lungs slowly'}
        {phase === 'hold' && 'Keep your breath steady'}
        {phase === 'exhale' && 'Release slowly and fully'}
      </p>
    </div>
  );
};

const WellbeingWidget: React.FC = () => {
  const { todayUsage, dailyLimit, isLimitReached, showBreakReminder, dismissBreakReminder } = useWellbeing();
  const [showBreathing, setShowBreathing] = useState(false);
  
  const usagePercentage = Math.min((todayUsage / dailyLimit) * 100, 100);
  const usageHours = Math.floor(todayUsage / 60);
  const usageMinutes = todayUsage % 60;

  return (
    <>
      {/* Usage indicator */}
      <div className="p-4 bg-card rounded-xl shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Today's Usage</span>
          </div>
          <span className={`text-sm font-medium ${isLimitReached ? 'text-destructive' : 'text-muted-foreground'}`}>
            {usageHours}h {usageMinutes}m / {Math.floor(dailyLimit / 60)}h
          </span>
        </div>
        
        <Progress
          value={usagePercentage}
          className={`h-2 ${isLimitReached ? '[&>div]:bg-destructive' : ''}`}
        />
        
        {usagePercentage >= 80 && !isLimitReached && (
          <p className="text-xs text-warning mt-2">
            You're approaching your daily limit. Consider taking a break soon.
          </p>
        )}
        
        {isLimitReached && (
          <p className="text-xs text-destructive mt-2">
            Daily limit reached. Take care of yourself!
          </p>
        )}
      </div>

      {/* Break reminder modal */}
      <Dialog open={showBreakReminder} onOpenChange={dismissBreakReminder}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-success" />
              Time for a Mindful Break
            </DialogTitle>
            <DialogDescription>
              You've been chatting for a while. Taking short breaks helps maintain your focus and wellbeing.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={() => {
                setShowBreathing(true);
                dismissBreakReminder();
              }}
              className="w-full"
              variant="default"
            >
              <Wind className="h-4 w-4 mr-2" />
              Start Breathing Exercise
            </Button>
            
            <Button
              onClick={dismissBreakReminder}
              variant="outline"
              className="w-full"
            >
              I'll take a break later
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Breathing exercise modal */}
      <Dialog open={showBreathing} onOpenChange={setShowBreathing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-primary" />
              4-7-8 Breathing
            </DialogTitle>
            <DialogDescription>
              This calming technique helps reduce anxiety and promote relaxation.
            </DialogDescription>
          </DialogHeader>
          
          <BreathingExercise onClose={() => setShowBreathing(false)} />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBreathing(false)}
            className="absolute top-2 right-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WellbeingWidget;
