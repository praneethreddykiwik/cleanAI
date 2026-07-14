'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Search,
  Star,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
  CreditCard,
  Ticket,
  ChevronRight,
  Loader2,
  User,
  ShieldCheck,
  Building,
  ArrowLeft,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { SearchBar } from '@/components/shared/SearchBar';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/glass-card';
import { containerVariants, serviceCardVariants, pageVariants } from '@/lib/animations';
import { formatCurrency, cn } from '@/lib/utils';
import { SERVICES_DATA, SERVICE_CATEGORIES } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { apiCall } from '@/lib/api';
import { toast } from 'sonner';
import { GoogleMapProvider } from '@/components/shared/GoogleMapProvider';
import { AddressAutocomplete } from '@/components/shared/AddressAutocomplete';
import { LocationPicker } from '@/components/shared/LocationPicker';
import { AIChatInterface } from '@/components/shared/AIChatInterface';

// Custom Drawer animation configs
const drawerVariants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 30 } },
  exit: { x: '100%', transition: { type: 'spring' as const, stiffness: 260, damping: 30 } },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const TIME_SLOTS = [
  '08:00 AM - 10:00 AM',
  '10:00 AM - 12:00 PM',
  '12:00 PM - 02:00 PM',
  '02:00 PM - 04:00 PM',
  '04:00 PM - 06:00 PM',
  '06:00 PM - 08:00 PM',
];

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Selected state variables
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Booking Drawer states
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [selectedAddressIdState, setSelectedAddressId] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [paymentMode, setPaymentMode] = useState('upi');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  
  // AI Estimate states
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [prefilledAI, setPrefilledAI] = useState<any>(null);
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);
  const [successBookingNumber, setSuccessBookingNumber] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Address creation sub-states inside Manual Booking Drawer
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [addressLabel, setAddressLabel] = useState<'Home' | 'Office' | 'Other'>('Home');
  const [addressLandmark, setAddressLandmark] = useState('');
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);
  const [resolvedLocation, setResolvedLocation] = useState<any>(null);

  // Fetch addresses
  const { data: addressesRes, refetch: refetchAddresses, isLoading: isAddressesLoading } = useQuery({
    queryKey: ['customer-addresses'],
    queryFn: () => apiCall('/users/me/addresses'),
  });
  const addresses = addressesRes?.data || [];
  const selectedAddressId = selectedAddressIdState || (addresses.find((a: any) => a.isDefault) || addresses[0])?.id || '';

  // Fetch database active services catalog to map service IDs
  const { data: servicesRes } = useQuery({
    queryKey: ['db-services-catalog'],
    queryFn: () => apiCall('/services'),
  });
  const dbServices = servicesRes?.data || [];

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'CLEAN50') {
      setCouponApplied(true);
      toast.success('Promo CLEAN50 applied successfully! Discounted ₹50.');
    } else {
      toast.error('Invalid coupon code.');
    }
  };

  const handleSelectAutocomplete = (details: any) => {
    setResolvedLocation(details);
  };

  const handleMarkerDrag = (lat: number, lng: number) => {
    if (resolvedLocation) {
      setResolvedLocation({ ...resolvedLocation, latitude: lat, longitude: lng });
    }
  };

  const handleSaveNewAddress = async () => {
    if (!resolvedLocation) {
      toast.error('Search and select a street location first.');
      return;
    }
    setIsCreatingAddress(true);
    try {
      const res = await apiCall('/users/me/addresses', {
        method: 'POST',
        body: JSON.stringify({
          label: addressLabel,
          line1: resolvedLocation.address,
          line2: addressLandmark || '',
          city: resolvedLocation.city || 'Bengaluru',
          state: resolvedLocation.state || 'Karnataka',
          pincode: resolvedLocation.postalCode || '560001',
          landmark: addressLandmark || '',
          latitude: resolvedLocation.latitude,
          longitude: resolvedLocation.longitude,
          isDefault: false,
        }),
      });

      if (res.success && res.data) {
        toast.success('New address pinned!');
        refetchAddresses();
        setSelectedAddressId(res.data.id);
        setShowAddAddressForm(false);
        setResolvedLocation(null);
        setAddressLandmark('');
      } else {
        toast.error(res.message || 'Failed to pin address');
      }
    } catch (e: any) {
      toast.error(e.message || 'Address save error');
    } finally {
      setIsCreatingAddress(false);
    }
  };

  // Create Booking
  const handleConfirmBooking = async () => {
    if (!bookingDate || !bookingTime) {
      toast.error('Please choose a date and time slot.');
      return;
    }
    if (!selectedAddressId) {
      toast.error('Please configure or select a service address.');
      return;
    }

    // Resolve service id
    const serviceName = selectedService?.name || '';
    const matched = dbServices.find((s: any) =>
      s.name.toLowerCase() === serviceName.toLowerCase() ||
      s.slug.toLowerCase() === serviceName.toLowerCase().replace(/ /g, '-')
    );

    if (!matched) {
      toast.error('Service is currently offline in DB database.');
      return;
    }

    const addr = addresses.find((a: any) => a.id === selectedAddressId);
    if (!addr) {
      toast.error('Selected address is invalid.');
      return;
    }

    // Calculate invoice values
    const base = prefilledAI ? prefilledAI.pricing.basePrice : selectedService.basePrice;
    const severityCharge = prefilledAI ? prefilledAI.pricing.severityFee : 0;
    const labourCharge = prefilledAI ? prefilledAI.pricing.labourFee : 0;
    const weekendCharge = prefilledAI ? prefilledAI.pricing.weekendSurcharge : 0;
    const couponDiscount = couponApplied ? 50 : 0;
    const subtotal = base + severityCharge + labourCharge + weekendCharge;
    const platform = 49;
    const gst = 50;
    const totalAmount = subtotal + platform + gst - couponDiscount;

    setIsSubmittingBooking(true);
    try {
      const res = await apiCall('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: matched.id,
          addressId: addr.id,
          scheduledDate: bookingDate,
          scheduledTime: bookingTime,
          notes: prefilledAI ? `AI Pinned: ${prefilledAI.complexity.subcategory}. Tools: ${prefilledAI.complexity.recommendedTools.join(', ')}. ${bookingNotes}` : bookingNotes,
          totalAmount,
          latitude: addr.latitude || 12.9716,
          longitude: addr.longitude || 77.5946,
          placeId: addr.placeId || '',
          city: addr.city,
          state: addr.state,
          postalCode: addr.pincode,
          country: addr.country || 'India',
        }),
      });

      if (res.success && res.data) {
        setSuccessBookingNumber(res.data.bookingNumber);
        setIsBookingSuccess(true);
        toast.success('Service Booking Placed Successfully!');
        // Reset inputs
        setBookingDate('');
        setBookingTime('');
        setBookingNotes('');
        setCouponApplied(false);
        setPrefilledAI(null);
      } else {
        toast.error(res.message || 'Failed to place booking');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error occurred during booking placement.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const filteredServices = SERVICES_DATA.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || s.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout
      role="customer"
      breadcrumbs={[
        { label: 'Customer', href: '/customer/dashboard' },
        { label: 'Services' },
      ]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 w-full relative"
      >
        {/* Page Header */}
        <motion.div variants={pageVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Services Catalog</h1>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">
              Select from verified platform options and matches pricing ranges.
            </p>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div variants={pageVariants} className="space-y-3">
          <div className="max-w-md">
            <SearchBar
              placeholder="Search home services..."
              onSearch={setSearchQuery}
              defaultValue={searchQuery}
              size="md"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1.5">
            {SERVICE_CATEGORIES.map((category) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  'relative px-4 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 border cursor-pointer leading-none',
                  activeCategory === category
                    ? 'text-white border-primary/20 shadow-xs'
                    : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border/30'
                )}
              >
                {activeCategory === category && (
                  <motion.div
                    layoutId="category-active"
                    className="absolute inset-0 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{category}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Catalog Grid */}
        <AnimatePresence mode="wait">
          {filteredServices.length > 0 ? (
            <motion.div
              key={activeCategory + searchQuery}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
            >
              {filteredServices.map((service, i) => (
                <GlassCard
                  key={service.id}
                  level={2}
                  glow
                  custom={i}
                  variants={serviceCardVariants}
                  initial="hidden"
                  animate="visible"
                  interactive
                  onClick={() => {
                    setSelectedService(service);
                    setIsDetailOpen(true);
                  }}
                  className="group flex flex-col h-full border border-white/40 dark:border-white/10 shadow-2xs hover:shadow-xs cursor-pointer relative overflow-hidden"
                >
                  {/* Service Image placeholder */}
                  <div className="h-32 bg-muted/40 relative flex items-center justify-center border-b border-border/20 overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-primary/5 group-hover:scale-105 transition-transform duration-500" />
                    <div className="text-4xl select-none z-10">{service.icon}</div>
                    
                    {/* Category */}
                    <div className="absolute top-2.5 left-2.5">
                      <Badge variant="glass" size="xs">
                        {service.category}
                      </Badge>
                    </div>

                    {/* Rating */}
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md px-2 py-0.5 rounded-full border border-border/25">
                      <Star size={9} className="text-amber-500 fill-amber-500" />
                      <span className="text-[9.5px] font-bold text-foreground">4.8</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors duration-200 truncate">
                          {service.name}
                        </h3>
                        {service.name.includes('Deep') && (
                          <span className="text-[8px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-md leading-none uppercase shrink-0 tracking-wider">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground/80 line-clamp-2 leading-relaxed font-semibold">
                        {service.description}
                      </p>
                      <p className="text-[9px] text-muted-foreground/60 font-semibold flex items-center gap-1">
                        <Clock size={10} /> Est. Duration: 2 Hours
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] font-medium text-muted-foreground/60">Starting price</span>
                        <p className="text-xs font-bold text-foreground">
                          {formatCurrency(service.basePrice)}
                        </p>
                      </div>

                      {/* Card CTAs */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/20">
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedService(service);
                            setIsAIModalOpen(true);
                          }}
                          className="rounded-xl font-bold text-[9px] h-7 gap-1 border-primary/20 text-primary hover:bg-primary/5"
                        >
                          <Sparkles size={10} className="animate-pulse text-primary" />
                          Try AI Estimate
                        </Button>
                        <Button
                          type="button"
                          variant="default"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedService(service);
                            setIsBookingOpen(true);
                          }}
                          className="rounded-xl font-bold text-[9px] h-7"
                        >
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </motion.div>
          ) : (
            <EmptyState
              icon={Search}
              title="No services found"
              description="No services matched your query. Try resetting filters."
              action={{
                label: "Clear filters",
                onClick: () => {
                  setSearchQuery('');
                  setActiveCategory('All');
                },
              }}
            />
          )}
        </AnimatePresence>

        {/* -------------------------------------------------
            1. PREMIUM SERVICE DETAILS DRAWER
           ------------------------------------------------- */}
        <AnimatePresence>
          {isDetailOpen && selectedService && (
            <>
              {/* Overlay */}
              <motion.div
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                onClick={() => setIsDetailOpen(false)}
                className="fixed inset-0 bg-black/45 backdrop-blur-xs z-40"
              />

              {/* Drawer Container */}
              <motion.div
                variants={drawerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border/50 shadow-2xl z-50 flex flex-col justify-between overflow-hidden"
              >
                {/* Header Banner */}
                <div className="relative h-44 bg-muted/40 flex items-center justify-center shrink-0 border-b border-border/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-primary/5" />
                  <div className="text-6xl select-none z-10">{selectedService.icon}</div>
                  <button
                    type="button"
                    onClick={() => setIsDetailOpen(false)}
                    className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/50 transition-colors z-20 cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div className="absolute top-4 right-4">
                    <Badge variant="glass">{selectedService.category}</Badge>
                  </div>
                </div>

                {/* Details Scroll Area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs font-semibold leading-relaxed">
                  <div>
                    <h2 className="text-base font-bold text-foreground">{selectedService.name}</h2>
                    <p className="text-[11px] text-muted-foreground mt-1">{selectedService.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/20">
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground/60 block">Base Price</span>
                      <span className="text-xs font-bold text-foreground">{formatCurrency(selectedService.basePrice)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/30 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground/60 block">Est. Duration</span>
                      <span className="text-xs font-bold text-foreground">2 - 3 Hours</span>
                    </div>
                  </div>

                  {/* What is Included / Excluded Mock */}
                  <div className="space-y-3 pt-3 border-t border-border/20">
                    <h4 className="text-xs font-bold text-foreground">What is Included</h4>
                    <ul className="space-y-1.5 text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-green-500" /> Professional-grade cleaning agents and equipment
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-green-500" /> Deep vacuuming & spot cleaning of surfaces
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-green-500" /> Satisfaction guarantee with free revisit support
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border/20">
                    <h4 className="text-xs font-bold text-foreground">What is Not Included</h4>
                    <ul className="space-y-1.5 text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <XCircle size={13} className="text-red-500" /> Major physical repair or wall restoration
                      </li>
                      <li className="flex items-center gap-2">
                        <XCircle size={13} className="text-red-500" /> Handling hazardous chemical disposal
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Bottom Actions Drawer */}
                <div className="p-4 pb-8 bg-muted/30 border-t border-border/30 grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDetailOpen(false);
                      setIsAIModalOpen(true);
                    }}
                    className="rounded-xl font-bold text-xs h-10 gap-1.5 border-primary/20 text-primary hover:bg-primary/5"
                  >
                    <Sparkles size={13} className="animate-pulse" />
                    Try AI Estimate
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => {
                      setIsDetailOpen(false);
                      setIsBookingOpen(true);
                    }}
                    className="rounded-xl font-bold text-xs h-10"
                  >
                    Book Now
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* -------------------------------------------------
            2. MANUAL BOOKING DRAWER / DIALOG (Pre-fill supported)
           ------------------------------------------------- */}
        <AnimatePresence>
          {isBookingOpen && selectedService && (
            <>
              {/* Overlay */}
              <motion.div
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                onClick={() => {
                  if (!isSubmittingBooking) {
                    setIsBookingOpen(false);
                    setPrefilledAI(null);
                  }
                }}
                className="fixed inset-0 bg-black/45 backdrop-blur-xs z-40"
              />

              {/* Drawer Container */}
              <motion.div
                variants={drawerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border/50 shadow-2xl z-50 flex flex-col justify-between overflow-hidden"
              >
                {/* Header */}
                <div className="px-5 py-4 border-b border-border/20 flex items-center justify-between shrink-0 bg-muted/20">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {prefilledAI ? 'Complete AI-Pinned Booking' : 'Confirm Service Booking'}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      {selectedService.name} · {prefilledAI ? 'Complexity custom estimate' : 'Standard flat rate'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmittingBooking}
                    onClick={() => {
                      setIsBookingOpen(false);
                      setPrefilledAI(null);
                    }}
                    className="text-muted-foreground/60 hover:text-foreground cursor-pointer"
                  >
                    <XCircle size={18} />
                  </button>
                </div>

                {/* Booking Success View */}
                {isBookingSuccess ? (
                  <div className="flex-1 p-6 flex flex-col justify-center items-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
                      <CheckCircle2 size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-foreground">Booking Confirmed!</h4>
                      <p className="text-xs text-muted-foreground">Your booking has been registered. View detail inside dashboard.</p>
                      <p className="text-[10px] font-mono bg-muted px-2.5 py-1 rounded-md inline-block text-muted-foreground select-all mt-1">
                        ID: {successBookingNumber}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsBookingSuccess(false);
                        setIsBookingOpen(false);
                        setSuccessBookingNumber('');
                      }}
                      className="rounded-xl w-full"
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Form Fields Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-semibold leading-relaxed">
                      {/* Date & Time Selector */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Service Date</label>
                          <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl border border-border bg-background text-[11px] font-semibold text-foreground outline-none focus:border-primary"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Time Slot</label>
                          <select
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            className="w-full h-9 px-2 rounded-xl border border-border bg-background text-[11px] font-semibold text-foreground outline-none focus:border-primary"
                          >
                            <option value="">-- Choose Slot --</option>
                            {TIME_SLOTS.map((slot) => (
                              <option key={slot} value={slot}>
                                {slot}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Address Selector / Inline Add Address Form */}
                      <div className="space-y-2 pt-3 border-t border-border/20">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Service Location</label>
                          <button
                            type="button"
                            onClick={() => setShowAddAddressForm(!showAddAddressForm)}
                            className="text-[10px] text-primary hover:underline font-bold"
                          >
                            {showAddAddressForm ? 'Select Saved' : '+ Pin New Address'}
                          </button>
                        </div>

                        {showAddAddressForm ? (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-3 p-3 bg-muted/20 border border-border/30 rounded-xl"
                          >
                            <GoogleMapProvider>
                              <div className="space-y-2">
                                <span className="text-[9px] uppercase text-muted-foreground block font-bold">Search Location</span>
                                <AddressAutocomplete onSelectAddress={handleSelectAutocomplete} placeholder="Type block/road..." />
                                
                                {resolvedLocation && (
                                  <>
                                    <div className="w-full h-32 rounded-xl overflow-hidden border border-border/30">
                                      <LocationPicker
                                        latitude={resolvedLocation.latitude}
                                        longitude={resolvedLocation.longitude}
                                        onChangeLocation={handleMarkerDrag}
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        type="text"
                                        value={addressLandmark}
                                        onChange={(e) => setAddressLandmark(e.target.value)}
                                        placeholder="Landmark"
                                        className="h-8 px-2 border border-border rounded-lg bg-background text-[10px]"
                                      />
                                      <select
                                        value={addressLabel}
                                        onChange={(e: any) => setAddressLabel(e.target.value)}
                                        className="h-8 px-2 border border-border rounded-lg bg-background text-[10px]"
                                      >
                                        <option value="Home">Home</option>
                                        <option value="Office">Office</option>
                                        <option value="Other">Other</option>
                                      </select>
                                    </div>
                                    <Button
                                      size="xs"
                                      type="button"
                                      disabled={isCreatingAddress}
                                      onClick={handleSaveNewAddress}
                                      className="w-full h-7 text-[10px]"
                                    >
                                      {isCreatingAddress ? 'Saving...' : 'Pin & Choose Address'}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </GoogleMapProvider>
                          </motion.div>
                        ) : isAddressesLoading ? (
                          <div className="text-[10px] text-muted-foreground">Loading addresses...</div>
                        ) : addresses.length > 0 ? (
                          <select
                            value={selectedAddressId}
                            onChange={(e) => setSelectedAddressId(e.target.value)}
                            className="w-full h-9 px-2 rounded-xl border border-border bg-background text-[11px] font-semibold text-foreground outline-none focus:border-primary"
                          >
                            {addresses.map((a: any) => (
                              <option key={a.id} value={a.id}>
                                {a.label}: {a.line1} ({a.city})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-[10px] text-red-500 font-bold">Please pin an address above to book.</div>
                        )}
                      </div>

                      {/* Instructions */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Special Instructions</label>
                        <textarea
                          rows={2}
                          value={bookingNotes}
                          onChange={(e) => setBookingNotes(e.target.value)}
                          placeholder="e.g. Bring extra wipes, call before arriving..."
                          className="w-full p-2.5 rounded-xl border border-border bg-background text-[11px] font-semibold text-foreground outline-none focus:border-primary"
                        />
                      </div>

                      {/* Coupon Section */}
                      <div className="space-y-1.5 pt-3 border-t border-border/20">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block">Apply Coupon</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            placeholder="Try CLEAN50"
                            className="flex-1 h-9 px-3 rounded-xl border border-border bg-background text-[11px] font-semibold text-foreground outline-none"
                          />
                          <Button size="xs" type="button" onClick={handleApplyCoupon} className="rounded-xl h-9 px-3">
                            Apply
                          </Button>
                        </div>
                      </div>

                      {/* Payment Mode Selector */}
                      <div className="space-y-2 pt-3 border-t border-border/20">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase block">Payment Method</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'upi', label: 'UPI / GPay' },
                            { id: 'cod', label: 'Cash / Card' },
                          ].map((pay) => (
                            <button
                              key={pay.id}
                              type="button"
                              onClick={() => setPaymentMode(pay.id)}
                              className={cn(
                                'h-9 border text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all',
                                paymentMode === pay.id
                                  ? 'border-primary bg-primary/5 text-primary'
                                  : 'border-border bg-background text-muted-foreground'
                              )}
                            >
                              <CreditCard size={12} />
                              {pay.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Invoice breakdown */}
                      <div className="p-4 rounded-xl bg-muted/20 border border-border/30 space-y-2 mt-4 text-[11px]">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground/60 block border-b border-border/20 pb-1">Price Details</span>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base Price</span>
                          <span className="text-foreground">
                            {formatCurrency(prefilledAI ? prefilledAI.pricing.basePrice : selectedService.basePrice)}
                          </span>
                        </div>
                        {prefilledAI && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">AI Severity Surcharge</span>
                              <span className="text-foreground">{formatCurrency(prefilledAI.pricing.severityFee)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">AI Labor Hourly Multiplier</span>
                              <span className="text-foreground">{formatCurrency(prefilledAI.pricing.labourFee)}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Platform Fee</span>
                          <span className="text-foreground">{formatCurrency(49)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Taxes & GST</span>
                          <span className="text-foreground">{formatCurrency(50)}</span>
                        </div>
                        {couponApplied && (
                          <div className="flex justify-between text-green-600 dark:text-green-400">
                            <span>Promo Discount</span>
                            <span>- {formatCurrency(50)}</span>
                          </div>
                        )}
                        <div className="h-px bg-border/20 my-1" />
                        <div className="flex justify-between font-bold text-foreground text-xs">
                          <span>Total Pay</span>
                          <span>
                            {formatCurrency(
                              (prefilledAI ? prefilledAI.pricing.basePrice : selectedService.basePrice) +
                              (prefilledAI ? prefilledAI.pricing.severityFee : 0) +
                              (prefilledAI ? prefilledAI.pricing.labourFee : 0) +
                              (prefilledAI ? prefilledAI.pricing.weekendSurcharge : 0) +
                              49 + 50 - (couponApplied ? 50 : 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Submit */}
                    <div className="p-4 pb-8 border-t border-border/30 bg-muted/20 shrink-0">
                      <Button
                        type="button"
                        onClick={handleConfirmBooking}
                        disabled={isSubmittingBooking}
                        className="w-full rounded-xl font-bold h-10 gap-1.5"
                      >
                        {isSubmittingBooking ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Dispatching matched agent...
                          </>
                        ) : (
                          'Confirm & Book Service'
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* -------------------------------------------------
            3. AI ESTIMATE WORKSPACE OVERLAY
           ------------------------------------------------- */}
        <AnimatePresence>
          {isAIModalOpen && selectedService && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="w-full max-w-lg"
              >
                <AIChatInterface
                  serviceName={selectedService.name}
                  addressId={selectedAddressId}
                  latitude={addresses.find((a: any) => a.id === selectedAddressId)?.latitude}
                  longitude={addresses.find((a: any) => a.id === selectedAddressId)?.longitude}
                  onBookingCreated={(num) => {
                    setSuccessBookingNumber(num);
                    setIsBookingSuccess(true);
                    setIsAIModalOpen(false);
                    setIsBookingOpen(true);
                  }}
                  onContinueBooking={(aiValues) => {
                    // Pre-fill fields and redirect seamlessly to manual booking drawer
                    setPrefilledAI(aiValues);
                    setIsAIModalOpen(false);
                    setIsBookingOpen(true);
                    toast.success('AI assessment pre-filled into booking engine!');
                  }}
                  onCancel={() => setIsAIModalOpen(false)}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
}
