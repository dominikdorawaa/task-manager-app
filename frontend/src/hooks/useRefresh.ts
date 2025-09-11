import { useState, useCallback } from 'react';
import { useQueryClient } from 'react-query';
import { useUser } from '@clerk/clerk-react';
import { useToast } from './useToast';

export const useRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { showSuccess, showError, showInfo } = useToast();

  const refreshData = useCallback(async () => {
    if (!user?.id || isRefreshing) return;
    
    setIsRefreshing(true);
    console.log('🔄 Manual refresh triggered...');
    showInfo('Odświeżanie danych...', 'Pobieranie najnowszych zadań...');
    
    try {
      await Promise.all([
        queryClient.invalidateQueries(['tasks', user.id]),
        queryClient.invalidateQueries(['externalUsers'])
      ]);
      console.log('✅ Data refreshed successfully');
      showSuccess('Dane odświeżone!', 'Pobrano najnowsze zadania i użytkowników.');
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      showError('Błąd odświeżania', 'Nie udało się pobrać najnowszych danych.');
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.id, queryClient, isRefreshing, showSuccess, showError, showInfo]);

  return {
    refreshData,
    isRefreshing
  };
};
