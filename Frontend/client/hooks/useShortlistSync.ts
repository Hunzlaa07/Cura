// src/hooks/useShortlistSync.ts
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface ShortlistedCandidate {
  id: number;
  applicant_id?: number;
  name?: string;
  full_name?: string;
  applicant_name?: string;
  title?: string;
  score?: number;
  [key: string]: any;
}

export const useShortlistSync = () => {
  const [shortlisted, setShortlisted] = useState<ShortlistedCandidate[]>([]);
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const token = localStorage.getItem('token');

  // Fetch shortlisted candidates from backend
  const fetchShortlisted = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/recruiters/shortlisted`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept-Language': i18n.language,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setShortlisted(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching shortlisted candidates:', err);
    }
  }, [token, i18n.language]);

  // Add to shortlist and refetch
  const handleShortlist = useCallback(
    async (candidateId: number, candidateName: string, candidateRole: string, candidateScore: number) => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/recruiters/shortlist/${candidateId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
              'Accept-Language': i18n.language,
            },
          }
        );

        if (response.ok) {
          toast({
            title: 'Success ✨',
            description: i18n.language === 'ar'
              ? 'تمت إضافة المرشح إلى القائمة المختصرة بنجاح!'
              : 'Candidate shortlisted successfully!',
            variant: 'default',
          });
          
          // Refetch to keep in sync with backend
          await fetchShortlisted();
        } else {
          const data = await response.json();
          toast({
            variant: 'destructive',
            title: 'Error',
            description: data.error || 'Failed to shortlist candidate',
          });
        }
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: i18n.language === 'ar'
            ? 'حدث خطأ أثناء إضافة المرشح إلى القائمة المختصرة'
            : 'Something went wrong while shortlisting the candidate.',
        });
      }
    },
    [token, i18n.language, toast, fetchShortlisted]
  );

  // Remove from shortlist and refetch
  const handleRemoveShortlist = useCallback(
    async (applicantId: number) => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/recruiters/shortlist/${applicantId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
              'Accept-Language': i18n.language,
            },
          }
        );

        if (response.ok) {
          toast({
            title: 'Success 🗑️',
            description: i18n.language === 'ar'
              ? 'تمت إزالة المرشح من القائمة المختصرة!'
              : 'Candidate removed from shortlist!',
            variant: 'default',
          });
          
          // Refetch to keep in sync with backend
          await fetchShortlisted();
        } else {
          const data = await response.json();
          toast({
            variant: 'destructive',
            title: 'Error',
            description: data.error || 'Failed to remove from shortlist',
          });
        }
      } catch (err) {
        console.error('Error removing from shortlist:', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: i18n.language === 'ar'
            ? 'حدث خطأ أثناء إزالة المرشح'
            : 'Error removing candidate',
        });
      }
    },
    [token, i18n.language, toast, fetchShortlisted]
  );

  // Check if candidate is shortlisted
  const isShortlisted = useCallback(
    (candidateId: number) => {
      return shortlisted.some((s) => s.id === candidateId || s.applicant_id === candidateId);
    },
    [shortlisted]
  );

  return {
    shortlisted,
    setShortlisted,
    handleShortlist,
    handleRemoveShortlist,
    isShortlisted,
    fetchShortlisted,
  };
};