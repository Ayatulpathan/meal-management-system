import { useState, useEffect, useCallback } from 'react';
import { memberService } from '../services/memberService';
import { validateMember } from '../utils/validation';

export const useMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = memberService.subscribeMembers((updatedMembers) => {
      setMembers(updatedMembers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addMember = useCallback(async (memberData) => {
    const validation = validateMember(memberData);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError, errors: validation.errors };
    }

    setActionLoading(true);
    setError(null);
    try {
      const newMember = await memberService.createMember(memberData);
      return { success: true, member: newMember };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, []);

  const updateMember = useCallback(async (memberId, memberData) => {
    const validation = validateMember(memberData);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError, errors: validation.errors };
    }

    setActionLoading(true);
    setError(null);
    try {
      const updated = await memberService.updateMember(memberId, memberData);
      return { success: true, member: updated };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, []);

  const deactivateMember = useCallback(async (memberId) => {
    setActionLoading(true);
    setError(null);
    try {
      await memberService.deactivateMember(memberId);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, []);

  const activateMember = useCallback(async (memberId) => {
    setActionLoading(true);
    setError(null);
    try {
      await memberService.activateMember(memberId);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, []);

  const activeMembers = members.filter(m => m.status === 'active');
  const inactiveMembers = members.filter(m => m.status === 'inactive');

  return {
    members,
    activeMembers,
    inactiveMembers,
    loading,
    actionLoading,
    error,
    addMember,
    updateMember,
    deactivateMember,
    activateMember,
  };
};
