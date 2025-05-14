
import { useEffect, useState } from 'react';
import { toast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface DataIntegrityMonitorProps {
  onRecover?: () => void;
}

/**
 * This component monitors data integrity and provides recovery mechanisms
 * for unsaved form submissions. It runs in the background and automatically
 * attempts to recover any locally saved form data when a connection is available.
 */
export const DataIntegrityMonitor = ({ onRecover }: DataIntegrityMonitorProps) => {
  const [pendingRecoveries, setPendingRecoveries] = useState<number>(0);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const [lastCheck, setLastCheck] = useState<number>(0);
  
  // Check for unsaved form data in localStorage
  const checkForUnsavedData = () => {
    if (typeof localStorage !== 'undefined') {
      try {
        const backups = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes('voters_backup_')) {
            try {
              const backup = JSON.parse(localStorage.getItem(key) || '{}');
              if (backup && backup.table === 'voters' && backup.data) {
                backups.push({ key, backup });
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
        
        setPendingRecoveries(backups.length);
        
        // If we find backups, alert the user
        if (backups.length > 0) {
          toast({
            title: "Found Unsaved Registrations",
            description: `${backups.length} unsaved registration(s) found. Click "Recover Data" to restore them.`,
            action: (
              <Button 
                variant="outline"
                onClick={attemptRecovery}
                disabled={isRecovering}
              >
                Recover Data
              </Button>
            ),
            duration: 10000, // Show for longer
          });
        }
      } catch (e) {
        console.error("Error checking for backups:", e);
      }
    }
    
    // Update last check timestamp
    setLastCheck(Date.now());
  };

  // Check on mount and when we come online
  useEffect(() => {
    // Check on mount
    checkForUnsavedData();
    
    // And when we come back online
    const handleOnline = () => {
      setTimeout(checkForUnsavedData, 2000);
    };
    
    // Set up a periodic check every 5 minutes
    const intervalId = setInterval(() => {
      checkForUnsavedData();
    }, 5 * 60 * 1000);
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(intervalId);
    };
  }, []);

  // Attempt to recover unsaved data
  const attemptRecovery = async () => {
    if (isRecovering) return;
    
    setIsRecovering(true);
    
    try {
      let recovered = 0;
      let failed = 0;
      const keysToRemove = [];
      
      // Find all backup data
      const backupKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('voters_backup_')) {
          backupKeys.push(key);
        }
      }
      
      // Process backups one by one
      for (const key of backupKeys) {
        try {
          const backupStr = localStorage.getItem(key);
          if (!backupStr) continue;
          
          const backup = JSON.parse(backupStr);
          if (backup && backup.table === 'voters' && backup.data) {
            // Try to submit to Supabase
            const { data, error } = await supabase
              .from('voters')
              .insert(backup.data)
              .select();
              
            if (error) {
              console.error("Recovery insert failed:", error);
              failed++;
            } else {
              console.log("Successfully recovered data:", data);
              recovered++;
              keysToRemove.push(key);
            }
          }
        } catch (e) {
          console.error("Error processing backup:", key, e);
          failed++;
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Remove successfully recovered backups
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore removal errors
        }
      });
      
      // Update the count
      setPendingRecoveries(prev => prev - recovered);
      
      // Notify user of the outcome
      if (recovered > 0) {
        toast({
          title: "Recovery Complete",
          description: `Successfully recovered ${recovered} registration(s). ${failed > 0 ? `${failed} failed.` : ''}`,
          variant: "default",
        });
        
        // Trigger refresh if provided
        if (onRecover) {
          onRecover();
        }
      } else if (failed > 0) {
        toast({
          title: "Recovery Failed",
          description: `Failed to recover ${failed} registration(s). Please try again later.`,
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error("Recovery attempt failed:", e);
      toast({
        title: "Recovery Error",
        description: "An unexpected error occurred during recovery.",
        variant: "destructive",
      });
    } finally {
      setIsRecovering(false);
    }
  };
  
  // Auto-recovery on application idle
  useEffect(() => {
    // If there are pending recoveries and no user activity for a while, try auto-recovery
    if (pendingRecoveries > 0 && !isRecovering) {
      const idleTimer = setTimeout(() => {
        console.log("Attempting auto-recovery of unsaved submissions...");
        attemptRecovery();
      }, 60000); // Wait 1 minute of inactivity
      
      return () => clearTimeout(idleTimer);
    }
  }, [pendingRecoveries, isRecovering]);
  
  // Background component - no visible UI
  return null;
};
