import { useState, useEffect, useCallback } from 'react';
import { memberService } from '../services/memberService';
import { useAuthContext } from '../context/AuthContext';
import { validateMember } from '../utils/validation';

export const useMembers = () => {
  const { isAdmin, currentMemberId } = useAuthContext();
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
    if (!isAdmin) {
      return { success: false, error: 'Permission denied: Only administrators can add members.' };
    }

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
  }, [isAdmin]);

  const updateMember = useCallback(async (memberId, memberData) => {
    // Admin can update any member; Member can only update their own profile
    if (!isAdmin && memberId !== currentMemberId) {
      return { success: false, error: 'Permission denied: You can only update your own profile.' };
    }

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
  }, [isAdmin, currentMemberId]);

  const deactivateMember = useCallback(async (memberId) => {
    if (!isAdmin) {
      return { success: false, error: 'Permission denied: Only administrators can deactivate members.' };
    }

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
  }, [isAdmin]);

  const activateMember = useCallback(async (memberId) => {
    if (!isAdmin) {
      return { success: false, error: 'Permission denied: Only administrators can reactivate members.' };
    }

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
  }, [isAdmin]);

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
