import React, { useEffect, useRef } from 'react';
import { useMessContext } from '../../context/MessContext';
import { useMonthContext } from '../../context/MonthContext';
import { useAuthContext } from '../../context/AuthContext';
import { emailAutoService } from '../../services/emailAutoService';
import { whatsappAutoService } from '../../services/whatsappAutoService';
import { getCurrentMonthId, getTodayDateString } from '../../utils/dateUtils';

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
  const sentTodayRef = useRef(new Set());

  const rawMonthId = monthDocId || selectedMonth || currentMonthData?.month || getCurrentMonthId();
  const activeMonthId = rawMonthId.includes('_') ? rawMonthId.split('_').pop() : rawMonthId;

  useEffect(() => {
    if (!user || !activeMonthId) return;

    const runCheck = async () => {
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;

      const todayStr = getTodayDateString();

      try {
        // 1. Email check & auto-dispatch
        const emailCfg = await emailAutoService.getConfig(currentMessId);
        if (emailCfg && emailCfg.enabled && !sentTodayRef.current.has(`${currentMessId}_email_${todayStr}`)) {
          const emailRes = await emailAutoService.checkAndAutoDispatchToday(
            [],
            activeMonthId,
            currentMessId
          );
          if (emailRes && emailRes.dispatched > 0) {
            sentTodayRef.current.add(`${currentMessId}_email_${todayStr}`);
            console.log(`[GlobalAutoDutyDispatcher] Auto-dispatched ${emailRes.dispatched} duty email alert(s).`);
            window.dispatchEvent(
              new CustomEvent('mms_duty_autodispatched', {
                detail: { count: emailRes.dispatched, type: 'email', results: emailRes.results },
              })
            );
          }
        }

        // 2. WhatsApp check & auto-dispatch
        const waCfg = await whatsappAutoService.getConfig(currentMessId);
        if (waCfg && waCfg.enabled && !sentTodayRef.current.has(`${currentMessId}_wa_${todayStr}`)) {
          const waRes = await whatsappAutoService.checkAndAutoDispatchToday(
            [],
            activeMonthId
          );
          if (waRes && waRes.dispatched > 0) {
            sentTodayRef.current.add(`${currentMessId}_wa_${todayStr}`);
            console.log(`[GlobalAutoDutyDispatcher] Auto-dispatched ${waRes.dispatched} WhatsApp alert(s).`);
            window.dispatchEvent(
              new CustomEvent('mms_duty_autodispatched', {
                detail: { count: waRes.dispatched, type: 'whatsapp', results: waRes.results },
              })
            );
          }
        }
      } catch (err) {
        console.warn('[GlobalAutoDutyDispatcher] Background check error:', err);
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Run immediately on mount or config change
    runCheck();

    // Check every 30 seconds
    const interval = setInterval(runCheck, 30000);

    return () => clearInterval(interval);
  }, [user, currentMessId, activeMonthId]);

  return null; // Silent background worker
};
