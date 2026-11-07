import React, { useEffect, useRef } from 'react';
import { useMessContext } from '../../context/MessContext';
import { useMonthContext } from '../../context/MonthContext';
import { useAuthContext } from '../../context/AuthContext';
import { emailAutoService } from '../../services/emailAutoService';
import { whatsappAutoService } from '../../services/whatsappAutoService';
import { getCurrentMonthId } from '../../utils/dateUtils';

/**
 * Global Background Duty Dispatcher
 * Mounts in Layout. Runs periodic checks to ensure duty emails and WhatsApp alerts
 * are sent on time at the mess's configured time without requiring the user to navigate to a specific page.
 */
export const GlobalAutoDutyDispatcher = () => {
  const { currentMessId } = useMessContext();
  const { monthDocId, selectedMonth, currentMonthData } = useMonthContext();
  const { user } = useAuthContext();
  const isCheckingRef = useRef(false);

  const activeMonthId = monthDocId || selectedMonth || currentMonthData?.month || getCurrentMonthId();

  useEffect(() => {
    if (!user || !activeMonthId) return;

    const runCheck = async () => {
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;

      try {
        // 1. Email check & auto-dispatch
        const emailCfg = await emailAutoService.getConfig(currentMessId);
        if (emailCfg && emailCfg.enabled) {
          const emailRes = await emailAutoService.checkAndAutoDispatchToday(
            [],
            activeMonthId,
            currentMessId
          );
          if (emailRes.dispatched > 0) {
            console.log(`[GlobalAutoDutyDispatcher] Auto-dispatched ${emailRes.dispatched} duty email alert(s).`);
          }
        }

        // 2. WhatsApp check & auto-dispatch
        const waCfg = await whatsappAutoService.getConfig(currentMessId);
        if (waCfg && waCfg.enabled) {
          const waRes = await whatsappAutoService.checkAndAutoDispatchToday(
            [],
            activeMonthId
          );
          if (waRes.dispatched > 0) {
            console.log(`[GlobalAutoDutyDispatcher] Auto-dispatched ${waRes.dispatched} WhatsApp alert(s).`);
          }
        }
      } catch (err) {
        console.warn('[GlobalAutoDutyDispatcher] Background check error:', err);
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Run on mount
    runCheck();

    // Check every 25 seconds
    const interval = setInterval(runCheck, 25000);

    return () => clearInterval(interval);
  }, [user, currentMessId, activeMonthId]);

  return null; // Silent background worker
};
