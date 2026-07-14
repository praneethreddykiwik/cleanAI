'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Eye,
  Star,
  RefreshCw,
  XCircle,
  HelpCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/shared/SearchBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { GlassCard } from '@/components/ui/glass-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { containerVariants, tableRowVariants } from '@/lib/animations';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { apiCall } from '@/lib/api';
import { getSocket, connectSocket } from '@/lib/socket';
import { MapProvider } from '@/components/shared/MapProvider';
import { AgentTrackingMap } from '@/components/shared/AgentTrackingMap';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function BookingsHistoryPage() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingBookingId, setRatingBookingId] = useState('');
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Live Details Modal state
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const fetchBookings = async () => {
    try {
      const res = await apiCall('/bookings');
      if (res.success && res.data) {
        // Map backend keys to layout properties
        const mapped = res.data.map((b: any) => ({
          id: b.id,
          bookingNumber: b.bookingNumber,
          service: b.service?.name || 'Deep Cleaning',
          vendor: b.vendor?.businessName || 'Searching for technician...',
          date: b.scheduledDate,
          time: b.scheduledTime,
          price: b.totalAmount,
          status: b.status,
          address: b.address ? `${b.address.line1}, ${b.address.city}` : 'No address recorded',
          latitude: b.latitude,
          longitude: b.longitude,
          agentName: b.agent ? `${b.agent.user?.firstName || ''} ${b.agent.user?.lastName || ''}`.trim() : null,
          rating: b.reviews?.[0]?.rating || null,
        }));
        setBookings(mapped);
      }
    } catch (e: any) {
      if (e.message?.includes('token') || e.message?.includes('auth') || e.message?.includes('401')) {
        console.warn('Authentication token expired or invalid:', e.message);
        logout();
      } else {
        console.error('Failed to load bookings list:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  // Connect client to Socket.IO to receive instant updates
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBookings();

    connectSocket();
    const socket = getSocket();

    // Re-query list when booking status changes on backend
    socket.on('booking.updated', () => {
      fetchBookings();
      toast.success('Live booking update received!');
    });

    socket.on('notification.created', (data: any) => {
      fetchBookings();
      toast.info(data.message || 'Notification received');
    });

    return () => {
      socket.off('booking.updated');
      socket.off('notification.created');
    };
  }, [authLoading, isAuthenticated]);

  const handleCancelBooking = async (id: string) => {
    try {
      const res = await apiCall(`/bookings/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Cancelled by customer' }),
      });
      if (res.success) {
        toast.success('Booking cancelled successfully.');
        fetchBookings();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel booking.');
    }
  };

  const handleReviewSubmit = async () => {
    try {
      const res = await apiCall(`/bookings/${ratingBookingId}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating: selectedRating, comment: reviewComment }),
      });
      if (res.success) {
        setShowRatingModal(false);
        setReviewComment('');
        toast.success('Thank you for your rating & review!');
        fetchBookings();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review.');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'ALL') return matchesSearch;
    if (activeTab === 'UPCOMING') {
      return (b.status === 'CONFIRMED' || b.status === 'PENDING' || b.status === 'AGENT_ASSIGNED' || b.status === 'IN_PROGRESS') && matchesSearch;
    }
    if (activeTab === 'COMPLETED') return b.status === 'COMPLETED' && matchesSearch;
    if (activeTab === 'CANCELLED') return b.status === 'CANCELLED' && matchesSearch;

    return matchesSearch;
  });

  if (authLoading) {
    return (
      <DashboardLayout
        role="customer"
        breadcrumbs={[{ label: 'Home Services', href: '/customer/services' }, { label: 'Booking History' }]}
      >
        <div className="text-center py-12 text-xs font-bold text-muted-foreground">Initializing session...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="customer"
      breadcrumbs={[{ label: 'Home Services', href: '/customer/services' }, { label: 'Booking History' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 w-full max-w-5xl mx-auto"
      >
        {/* Title Section */}
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Booking History</h2>
          <p className="text-xs text-muted-foreground font-semibold">
            Track real-time progress, review past vendor dispatches, and manage schedules.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-muted/30 dark:bg-white/4 p-1 rounded-xl border border-border/30 self-start">
            {(['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-[10.5px] font-extrabold capitalize transition-all cursor-pointer leading-none',
                  activeTab === tab
                    ? 'bg-background text-foreground shadow-xs border border-border/20'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.toLowerCase()}
              </button>
            ))}
          </div>

          <div className="w-full md:w-64">
            <SearchBar
              placeholder="Search service, vendor, id..."
              onSearch={setSearchQuery}
              defaultValue={searchQuery}
              size="sm"
            />
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-xs font-bold text-muted-foreground">Loading service history...</div>
          ) : filteredBookings.length > 0 ? (
            filteredBookings.map((booking, idx) => (
              <GlassCard
                level={2}
                key={booking.id}
                custom={idx}
                variants={tableRowVariants}
                initial="hidden"
                animate="visible"
                className="border border-white/40 dark:border-white/10 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xs hover:shadow-xs"
              >
                <div className="space-y-3.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold bg-foreground/5 dark:bg-white/6 text-muted-foreground px-2 py-0.5 rounded-md border border-border/20">
                      {booking.bookingNumber}
                    </span>
                    <StatusBadge status={booking.status} size="sm" />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{booking.service}</h3>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">{booking.vendor}</p>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-muted-foreground/60" />
                      {formatDate(booking.date)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-muted-foreground/60" />
                      {booking.time}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-muted-foreground/60" />
                      {booking.address}
                    </span>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-end gap-3 justify-between w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-border/20">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-medium text-muted-foreground/60">Amount paid</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">
                      {formatCurrency(booking.price)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {booking.status === 'COMPLETED' && !booking.rating && (
                      <Button
                        size="xs"
                        onClick={() => {
                          setRatingBookingId(booking.id);
                          setShowRatingModal(true);
                        }}
                        className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[10.5px]"
                      >
                        <Star size={11} className="fill-white" /> Rate Service
                      </Button>
                    )}

                    {booking.status === 'COMPLETED' && booking.rating && (
                      <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 px-2.5 py-1 rounded-lg text-[10.5px] font-semibold leading-none">
                        <Star size={10} className="fill-current" /> {booking.rating} / 5
                      </div>
                    )}

                    {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
                      <Button
                        size="xs"
                        variant="destructive"
                        onClick={() => handleCancelBooking(booking.id)}
                        className="gap-1.5 rounded-lg font-bold text-[10.5px]"
                      >
                        <XCircle size={11} /> Cancel
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowDetailsModal(true);
                      }}
                      className="gap-1.5 rounded-lg text-[10.5px] font-bold border-border/60"
                    >
                      <Eye size={11} /> Track Details
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))
          ) : (
            <EmptyState
              icon={HelpCircle}
              title="No bookings found"
              description="No bookings matched your search or status filter tags."
              action={{
                label: "Clear filters",
                onClick: () => {
                  setSearchQuery('');
                  setActiveTab('ALL');
                },
              }}
            />
          )}
        </div>

        {/* Live Details Dialog Tracker */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">Operational Track Console</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-semibold">
                Booking Reference: #{selectedBooking?.bookingNumber}
              </DialogDescription>
            </DialogHeader>

            {selectedBooking && (
              <div className="space-y-4 pt-3">
                {/* Live tracking map if enroute */}
                {selectedBooking.latitude && selectedBooking.longitude && (
                  <div className="w-full h-44 rounded-2xl overflow-hidden border border-border/30 relative">
                    <MapProvider>
                      <AgentTrackingMap
                        customerLat={selectedBooking.latitude}
                        customerLng={selectedBooking.longitude}
                        bookingId={selectedBooking.id}
                        className="absolute inset-0"
                      />
                    </MapProvider>
                  </div>
                )}

                {/* State timeline */}
                <div className="p-4 bg-muted/20 border border-border/30 rounded-2xl space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 block">Dispatch Status Tracker</span>
                  <div className="space-y-1.5 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-foreground">Service requested in database</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span className="text-foreground">Vendor accepted booking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(selectedBooking.agentName ? "text-green-500" : "text-muted-foreground")}>
                        {selectedBooking.agentName ? "✓" : "○"}
                      </span>
                      <span className={cn(selectedBooking.agentName ? "text-foreground font-bold" : "text-muted-foreground/60")}>
                        {selectedBooking.agentName ? `Technician ${selectedBooking.agentName} assigned` : 'Waiting for technician assignment'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(selectedBooking.status === 'COMPLETED' ? "text-green-500" : "text-muted-foreground")}>
                        {selectedBooking.status === 'COMPLETED' ? "✓" : "○"}
                      </span>
                      <span className={cn(selectedBooking.status === 'COMPLETED' ? "text-foreground font-bold" : "text-muted-foreground/60")}>
                        Work completed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-4 border-t border-border/20 mt-4">
              <Button size="sm" className="font-bold text-xs" onClick={() => setShowDetailsModal(false)}>
                Close Tracking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rating Dialog Modal */}
        <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
          <DialogContent className="max-w-sm p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">Rate your Service</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground/80 font-semibold mt-1">
                Tell us about your experience with this booking vendor dispatch.
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-2 justify-center py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedRating(star)}
                  className="p-1 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                >
                  <Star
                    size={22}
                    className={cn(
                      'transition-colors',
                      star <= selectedRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/25'
                    )}
                  />
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground/75 flex items-center gap-1.5">
                <MessageSquare size={12} />
                Write Review
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="What did you like or dislike? (Optional)"
                rows={3}
                className="w-full border border-border/30 rounded-xl p-3 text-xs outline-none bg-background focus:border-primary/45 focus:ring-3 focus:ring-primary/10 transition-all resize-none font-semibold text-foreground placeholder:text-muted-foreground/60"
              />
            </div>

            <DialogFooter className="flex-row gap-2 justify-end pt-4 border-t border-border/20 mt-4">
              <Button variant="ghost" size="sm" className="font-bold text-xs" onClick={() => setShowRatingModal(false)}>
                Cancel
              </Button>
              <Button size="sm" className="font-bold text-xs" onClick={handleReviewSubmit}>
                Submit Review
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
}
