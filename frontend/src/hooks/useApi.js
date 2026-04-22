import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { useState } from 'react';

export const useApiQuery = (key, queryFn, options = {}) => {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    ...options
  });
};

export const useApiMutation = (mutationFn, options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      if (options.successMessage) {
        message.success(options.successMessage);
      }
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
        });
      }
      options.onSuccess?.(data, variables, context);
    },
    onError: (error) => {
      message.error(error?.message || 'Operation failed');
      options.onError?.(error);
    },
    ...options
  });
};

export const usePagination = (initialPage = 1, initialPageSize = 10) => {
  const [pagination, setPagination] = useState({
    current: initialPage,
    pageSize: initialPageSize
  });

  const handleTableChange = (page, pageSize) => {
    setPagination({ current: page, pageSize });
  };

  return { pagination, handleTableChange };
};
