import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '@/lib/api';
import { toast } from 'sonner';

export interface NotificationItem {
  id: string;
  userId: string;
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN' | 'AGENT';
  title: string;
  message: string;
  type: 'BOOKING' | 'PAYMENT' | 'SYSTEM' | 'PROMOTION' | 'ALERT';
  priority: string;
  isRead: boolean;
  actionUrl: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export function useNotifications(filters: {
  status?: 'ALL' | 'UNREAD' | 'READ';
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
  enabledFeed?: boolean;
  enabledUnreadCount?: boolean;
} = {}) {
  const queryClient = useQueryClient();
  const {
    status = 'ALL',
    type = 'ALL',
    search = '',
    page = 1,
    limit = 10,
    enabledFeed = true,
    enabledUnreadCount = true,
  } = filters;

  // Query notifications feed
  const feedQuery = useQuery({
    queryKey: ['notifications', { status, type, search, page, limit }],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (status !== 'ALL') searchParams.append('status', status);
      if (type !== 'ALL') searchParams.append('type', type);
      if (search) searchParams.append('search', search);
      searchParams.append('page', String(page));
      searchParams.append('limit', String(limit));

      const res = await apiCall(`/notifications?${searchParams.toString()}`);
      return res;
    },
    enabled: enabledFeed,
    staleTime: 30000, // Cache feed for 30 seconds
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  // Query unread count
  const unreadCountQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const res = await apiCall('/notifications/unread-count');
      return res.data?.count ?? 0;
    },
    enabled: enabledUnreadCount,
    staleTime: 15000, // Cache unread count for 15 seconds
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    refetchInterval: enabledUnreadCount ? 30000 : false, // Poll unread count every 30 seconds
  });

  // Mark single as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiCall(`/notifications/${id}/read`, { method: 'PATCH' });
      return res.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousFeed = queryClient.getQueryData(['notifications', { status, type, search, page, limit }]);
      const previousCount = queryClient.getQueryData(['notifications', 'unread-count']);

      // Optimistic feed update
      if (previousFeed) {
        queryClient.setQueryData(
          ['notifications', { status, type, search, page, limit }],
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              data: old.data.map((item: NotificationItem) =>
                item.id === id ? { ...item, isRead: true } : item
              ),
            };
          }
        );
      }

      // Optimistic count update
      if (typeof previousCount === 'number') {
        queryClient.setQueryData(['notifications', 'unread-count'], Math.max(0, previousCount - 1));
      }

      return { previousFeed, previousCount };
    },
    onError: (err, id, context: any) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(
          ['notifications', { status, type, search, page, limit }],
          context.previousFeed
        );
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(['notifications', 'unread-count'], context.previousCount);
      }
      toast.error('Failed to mark notification as read');
    },
    onSuccess: () => {
      toast.success('Marked as read');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiCall('/notifications/read-all', { method: 'PATCH' });
      return res;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousFeed = queryClient.getQueryData(['notifications', { status, type, search, page, limit }]);
      const previousCount = queryClient.getQueryData(['notifications', 'unread-count']);

      // Optimistic feed update
      if (previousFeed) {
        queryClient.setQueryData(
          ['notifications', { status, type, search, page, limit }],
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              data: old.data.map((item: NotificationItem) => ({ ...item, isRead: true })),
            };
          }
        );
      }

      // Optimistic count update
      queryClient.setQueryData(['notifications', 'unread-count'], 0);

      return { previousFeed, previousCount };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(
          ['notifications', { status, type, search, page, limit }],
          context.previousFeed
        );
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(['notifications', 'unread-count'], context.previousCount);
      }
      toast.error('Failed to mark all notifications as read');
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiCall(`/notifications/${id}`, { method: 'DELETE' });
      return res.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousFeed = queryClient.getQueryData(['notifications', { status, type, search, page, limit }]);
      const previousCount = queryClient.getQueryData(['notifications', 'unread-count']);

      // Find if deleted notification was unread
      let wasUnread = false;

      // Optimistic feed update
      if (previousFeed) {
        queryClient.setQueryData(
          ['notifications', { status, type, search, page, limit }],
          (old: any) => {
            if (!old) return old;
            const item = old.data.find((i: NotificationItem) => i.id === id);
            if (item && !item.isRead) {
              wasUnread = true;
            }
            return {
              ...old,
              data: old.data.filter((i: NotificationItem) => i.id !== id),
            };
          }
        );
      }

      // Optimistic count update
      if (wasUnread && typeof previousCount === 'number') {
        queryClient.setQueryData(['notifications', 'unread-count'], Math.max(0, previousCount - 1));
      }

      return { previousFeed, previousCount, wasUnread };
    },
    onError: (err, id, context: any) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(
          ['notifications', { status, type, search, page, limit }],
          context.previousFeed
        );
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(['notifications', 'unread-count'], context.previousCount);
      }
      toast.error('Failed to clear notification');
    },
    onSuccess: () => {
      toast.success('Notification cleared');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications: feedQuery.data?.data ?? [],
    pagination: feedQuery.data?.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 1 },
    unreadCount: unreadCountQuery.data ?? 0,
    isLoading: feedQuery.isLoading || unreadCountQuery.isLoading,
    isError: feedQuery.isError || unreadCountQuery.isError,
    error: feedQuery.error || unreadCountQuery.error,
    refetch: feedQuery.refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
    deleteNotification: deleteMutation.mutate,
  };
}
