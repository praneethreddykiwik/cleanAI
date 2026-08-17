'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CreditCard,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  FileText,
  User,
  ShieldCheck,
  Building,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import { containerVariants, cardVariants } from '@/lib/animations';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { apiCall } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleMapProvider } from '@/components/shared/GoogleMapProvider';
import { AddressAutocomplete } from '@/components/shared/AddressAutocomplete';
import { LocationPicker } from '@/components/shared/LocationPicker';
import { AIChatInterface } from '@/components/shared/AIChatInterface';

// ==================
// Steps
// ==================
const STEPS = [
  { id: 'service', label: 'Service Details', icon: FileText },
  { id: 'schedule', label: 'Schedule', icon: CalendarIcon },
  { id: 'address', label: 'Address', icon: MapPin },
  { id: 'payment', label: 'Payment', icon: CreditCard },
];

const TIME_SLOTS = [
  '08:00 AM - 10:00 AM',
  '10:00 AM - 12:00 PM',
  '12:00 PM - 02:00 PM',
  '02:00 PM - 04:00 PM',
  '04:00 PM - 06:00 PM',
  '06:00 PM - 08:00 PM',
];

const PRESET_ADDRESSES = [
  { id: '1', label: 'Home', line1: 'Flat 402, Block A, Prestige Heights', city: 'Bengaluru', pincode: '560001', isDefault: true },
  { id: '2', label: 'Office', line1: '4th Floor, Vercel Hub, Outer Ring Road', city: 'Bengaluru', pincode: '560103', isDefault: false },
];

function BookingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const serviceName = searchParams.get('service') || 'Deep Cleaning';
  const basePrice = parseInt(searchParams.get('price') || '1499');

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedAddressState, setSelectedAddress] = useState<string>('');
  
  // New address custom state variables
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressLabel, setAddressLabel] = useState<'Home' | 'Office' | 'Other'>('Home');
  const [addressLandmark, setAddressLandmark] = useState('');
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  
  // Autocomplete coordinates state variables
  const [resolvedLocation, setResolvedLocation] = useState<{
    address: string;
    latitude: number;
    longitude: number;
    placeId: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  } | null>(null);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi');
  const [isBookingComplete, setIsBookingComplete] = useState(false);
  const [bookingNumber, setBookingNumber] = useState('');
  const [isAIBooking, setIsAIBooking] = useState(false);

  // Fetch customer addresses — only after auth is confirmed
  const { data: addressesData, refetch: refetchAddresses, isLoading: isAddressesLoading } = useQuery({
    queryKey: ['customer-addresses'],
    queryFn: () => apiCall('/users/me/addresses'),
    enabled: isAuthenticated && !authLoading,
    retry: 1,
  });
  const addresses = addressesData?.data || [];
  const selectedAddress = selectedAddressState || (addresses.find((a: any) => a.isDefault) || addresses[0])?.id || '';

  // Fetch active services — public endpoint, but wait for auth hydration first
  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => apiCall('/services'),
    enabled: !authLoading,
    retry: 1,
    staleTime: 5 * 60 * 1000, // Services rarely change — cache 5 min
  });
  const services = servicesData?.data || [];

  const handleSelectAddress = (details: any) => {
    setResolvedLocation(details);
  };

  const handleMarkerDrag = (lat: number, lng: number, details?: any) => {
    if (details) {
      setResolvedLocation(details);
    } else if (resolvedLocation) {
      setResolvedLocation({
        ...resolvedLocation,
        latitude: lat,
        longitude: lng,
      });
    }
  };

  const handleAddAddress = async () => {
    if (!resolvedLocation) {
      toast.error('Please search and select an address first');
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
        toast.success('Address added successfully!');
        refetchAddresses();
        setSelectedAddress(res.data.id);
        setShowAddressForm(false);
        setAddressLandmark('');
        setResolvedLocation(null);
      } else {
        toast.error(res.message || 'Failed to add address');
      }
    } catch (e: any) {
      toast.error(e.message || 'An error occurred while adding address');
    } finally {
      setIsCreatingAddress(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && (!selectedDate || !selectedTime)) {
      toast.error('Please select both a date and a time slot.');
      return;
    }
    if (currentStep === 2 && !selectedAddress && !showAddressForm) {
      toast.error('Please select or add a service address.');
      return;
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateBooking = async () => {
    const matchedService = services.find((s: any) =>
      s.name.toLowerCase() === serviceName.toLowerCase() ||
      s.slug.toLowerCase() === serviceName.toLowerCase().replace(/ /g, '-')
    );

    if (!matchedService) {
      toast.error('Selected service is not active in database catalog');
      return;
    }

    const addr = addresses.find((a: any) => a.id === selectedAddress);
    if (!addr) {
      toast.error('Please select a valid address.');
      return;
    }

    if (addr.latitude === null || addr.longitude === null) {
      toast.error('Address does not contain valid map coordinates. Please delete and recreate it.');
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const res = await apiCall('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: matchedService.id,
          addressId: addr.id,
          scheduledDate: selectedDate,
          scheduledTime: selectedTime,
          notes: 'Google Maps location-pinned booking',
          totalAmount: basePrice + 99,
          paymentMethod: selectedPaymentMethod.toUpperCase(), // UPI | CARD | COD
          latitude: addr.latitude,
          longitude: addr.longitude,
          placeId: addr.placeId || '',
          city: addr.city,
          state: addr.state,
          postalCode: addr.pincode,
          country: addr.country || 'India',
        }),
      });

      if (res.success && res.data) {
        setBookingNumber(res.data.bookingNumber);
        setIsBookingComplete(true);
        toast.success('Booking Placed Successfully!');
      } else {
        toast.error(res.message || 'Failed to place booking');
      }
    } catch (e: any) {
      toast.error(e.message || 'An error occurred while placing booking');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const currentStepId = STEPS[currentStep].id;

  if (isBookingComplete) {
    return (
      <DashboardLayout role="customer" breadcrumbs={[{ label: 'Booking' }, { label: 'Confirmation' }]}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl mx-auto text-center space-y-6 py-12"
        >
          <div className="mx-auto w-16 h-16 bg-green-50 border border-green-200 text-green-600 rounded-full flex items-center justify-center">
            <CheckCircle2 size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Booking Confirmed!</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your booking for <span className="font-semibold text-foreground">{serviceName}</span> has been scheduled successfully.
            </p>
            <p className="text-xs font-mono bg-muted text-muted-foreground px-3 py-1.5 rounded-lg inline-block select-all">
              ID: {bookingNumber}
            </p>
          </div>

          <div className="border border-border/60 rounded-2xl bg-card p-5 text-left space-y-4 max-w-md mx-auto">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Booking Summary</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-semibold text-foreground">{serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scheduled Date</span>
                <span className="font-semibold text-foreground">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Slot</span>
                <span className="font-semibold text-foreground">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-semibold text-foreground">{formatCurrency(basePrice + 99)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" size="sm" onClick={() => router.push('/customer/dashboard')}>
              Go to Dashboard
            </Button>
            <Button size="sm" onClick={() => router.push('/customer/bookings')}>
              View Bookings
            </Button>
          </div>
        </motion.div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="customer"
      breadcrumbs={[{ label: 'Home Services' }, { label: 'Book Service' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Book {serviceName}</h2>
            <p className="text-sm text-muted-foreground">Complete the steps to schedule your professional service.</p>
          </div>

          {/* AI Booking Toggle Button */}
          <Button
            variant={isAIBooking ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAIBooking(!isAIBooking)}
            className="gap-1.5 text-xs rounded-xl self-start sm:self-auto"
          >
            <Sparkles size={14} className={cn("text-primary", isAIBooking && "text-white animate-pulse")} />
            {isAIBooking ? "Standard Booking" : "AI Booking"}
          </Button>
        </div>

        {isAIBooking ? (
          <div className="max-w-2xl mx-auto w-full">
            <AIChatInterface
              serviceName={serviceName}
              serviceId={
                services.find(
                  (s: any) =>
                    (s.slug || '').toLowerCase() === serviceName.toLowerCase().replace(/ /g, '-') ||
                    (s.name || '').toLowerCase() === serviceName.toLowerCase()
                )?.id
              }
              addressId={selectedAddress}
              latitude={addresses.find((a: any) => a.id === selectedAddress)?.latitude}
              longitude={addresses.find((a: any) => a.id === selectedAddress)?.longitude}
              onBookingCreated={(num) => {
                setBookingNumber(num);
                setIsBookingComplete(true);
              }}
              onCancel={() => setIsAIBooking(false)}
            />
          </div>
        ) : (
          <>
            {/* Wizard Steps */}
            <div className="grid grid-cols-4 border-b border-border/50 pb-4">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                return (
                  <div key={step.id} className="flex flex-col items-center text-center space-y-1.5 relative">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200',
                        isActive && 'bg-primary border-primary text-white shadow-md shadow-primary/20',
                        isCompleted && 'bg-green-50 border-green-200 text-green-600',
                        !isActive && !isCompleted && 'bg-muted border-border/50 text-muted-foreground'
                      )}
                    >
                      <Icon size={14} />
                    </div>
                    <span
                      className={cn(
                        'text-[10px] sm:text-xs font-medium transition-colors duration-200',
                        isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Wizard Body Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content Area (Left 2 cols) */}
              <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 p-6 min-h-[300px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {currentStepId === 'service' && (
                    <motion.div
                      key="service"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      <h3 className="text-base font-semibold text-foreground">Service Specification</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        You have selected the <span className="font-semibold text-foreground">{serviceName}</span> package. This includes expert, background-verified professionals equipped with advanced tools to ensure a premium finish.
                      </p>
                      <div className="border border-border/60 rounded-xl p-4 bg-muted/20 space-y-2">
                        <div className="flex gap-2 items-center text-xs font-semibold text-foreground">
                          <ShieldCheck size={14} className="text-green-600" />
                          Clean AI Guarantee
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Free re-cleaning if you are not fully satisfied with the quality of service.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {currentStepId === 'schedule' && (
                    <motion.div
                      key="schedule"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-5"
                    >
                      <div className="space-y-1.5">
                        <h3 className="text-base font-semibold text-foreground">Select Date & Time</h3>
                        <p className="text-xs text-muted-foreground">Choose a convenient date and timing slot.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground">Select Date</label>
                          <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground">Available Slots</label>
                          <div className="grid grid-cols-1 gap-2">
                            {TIME_SLOTS.map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setSelectedTime(slot)}
                                className={cn(
                                  'h-9 border rounded-xl text-left px-3 text-xs transition-all flex items-center gap-2',
                                  selectedTime === slot
                                    ? 'border-primary bg-primary/5 text-primary font-semibold'
                                    : 'border-border/50 bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
                                )}
                              >
                                <Clock size={13} />
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentStepId === 'address' && (
                    <motion.div
                      key="address"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-4"
                    >
                      <h3 className="text-base font-semibold text-foreground">Service Address</h3>
                      <p className="text-xs text-muted-foreground">Select where the agent should arrive.</p>

                      {isAddressesLoading ? (
                        <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
                          <Loader2 size={14} className="animate-spin text-primary mr-2" />
                          Loading your saved locations...
                        </div>
                      ) : addresses.length > 0 && !showAddressForm ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {addresses.map((addr: any) => (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => {
                                setSelectedAddress(addr.id);
                                setShowAddressForm(false);
                              }}
                              className={cn(
                                'p-4 border rounded-xl text-left space-y-1.5 transition-all relative flex flex-col justify-between h-28',
                                selectedAddress === addr.id
                                  ? 'border-primary bg-primary/5 text-primary font-semibold'
                                  : 'border-border/50 bg-background hover:bg-muted text-muted-foreground'
                              )}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                  {addr.label === 'Home' ? <User size={12} /> : <Building size={12} />}
                                  {addr.label}
                                </span>
                                {addr.isDefault && (
                                  <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] leading-relaxed line-clamp-2">{addr.line1}</p>
                            </button>
                          ))}
                        </div>
                      ) : !showAddressForm ? (
                        <div className="text-center py-6 border border-dashed border-border/30 rounded-2xl p-4 bg-muted/10">
                          <MapPin className="mx-auto text-muted-foreground/45 mb-2" size={24} />
                          <p className="text-xs font-semibold text-foreground">No saved addresses found</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Please add a location to schedule this service booking.</p>
                        </div>
                      ) : null}

                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowAddressForm(!showAddressForm);
                            setResolvedLocation(null);
                          }}
                        >
                          {showAddressForm ? 'Cancel New Address' : 'Add New Address'}
                        </Button>

                        {showAddressForm && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-4 pt-4 border-t border-border/50 mt-4"
                          >
                            <GoogleMapProvider>
                              <div className="space-y-3.5">
                                {/* Autocomplete Input */}
                                <div className="space-y-1.5">
                                  <label className="text-xs font-semibold text-muted-foreground">Search Address</label>
                                  <AddressAutocomplete onSelectAddress={handleSelectAddress} />
                                </div>

                                {resolvedLocation && (
                                  <>
                                    {/* Coordinates Map Picker */}
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                                        <span>Pinpoint on Map</span>
                                        <span className="text-[9.5px] font-medium text-muted-foreground/60">(Drag the marker to fine-tune)</span>
                                      </label>
                                      <div className="w-full h-48 rounded-2xl overflow-hidden border border-border/30">
                                        <LocationPicker
                                          latitude={resolvedLocation.latitude}
                                          longitude={resolvedLocation.longitude}
                                          onChangeLocation={handleMarkerDrag}
                                        />
                                      </div>
                                    </div>

                                    {/* Extra details form */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground">Landmark</label>
                                        <input
                                          type="text"
                                          value={addressLandmark}
                                          onChange={(e) => setAddressLandmark(e.target.value)}
                                          placeholder="e.g. Near central park"
                                          className="w-full h-10 px-3.5 rounded-full border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 font-semibold"
                                        />
                                      </div>
                                      <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-muted-foreground">Address Label</label>
                                        <div className="flex gap-2">
                                          {(['Home', 'Office', 'Other'] as const).map((lbl) => (
                                            <button
                                              key={lbl}
                                              type="button"
                                              onClick={() => setAddressLabel(lbl)}
                                              className={cn(
                                                'flex-1 h-10 rounded-full border text-xs font-bold transition-all',
                                                addressLabel === lbl
                                                  ? 'border-primary bg-primary/5 text-primary'
                                                  : 'border-border bg-background hover:bg-muted text-muted-foreground'
                                              )}
                                            >
                                              {lbl}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>

                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={isCreatingAddress}
                                      onClick={handleAddAddress}
                                      className="w-full mt-2 font-bold"
                                    >
                                      {isCreatingAddress ? (
                                        <>
                                          <Loader2 size={13} className="animate-spin mr-1" /> Adding Address...
                                        </>
                                      ) : (
                                        'Save Address & Pin Location'
                                      )}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </GoogleMapProvider>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {currentStepId === 'payment' && (
                    <motion.div
                      key="payment"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-5"
                    >
                      <h3 className="text-base font-semibold text-foreground">Select Payment Mode</h3>

                      <div className="space-y-3">
                        {[
                          { id: 'upi' as const, label: 'UPI (GPay / PhonePe / Paytm)', icon: '📱', desc: 'Instant, secure checkout' },
                          { id: 'card' as const, label: 'Credit or Debit Card', icon: '💳', desc: 'Visa, MasterCard, RuPay' },
                          { id: 'cod' as const, label: 'Cash on Service Completion', icon: '💵', desc: 'Pay directly after completion' },
                        ].map((mode) => (
                          <label
                            key={mode.id}
                            className={`flex items-center gap-3 p-3.5 border rounded-xl bg-background hover:bg-muted/30 cursor-pointer transition-colors ${
                              selectedPaymentMethod === mode.id
                                ? 'border-primary ring-1 ring-primary/20'
                                : 'border-border/50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="paymentMode"
                              checked={selectedPaymentMethod === mode.id}
                              onChange={() => setSelectedPaymentMethod(mode.id)}
                              className="w-4 h-4 text-primary focus:ring-primary/20 accent-primary"
                            />
                            <span className="text-xl shrink-0">{mode.icon}</span>
                            <div>
                              <p className="text-xs font-semibold text-foreground">{mode.label}</p>
                              <p className="text-[10px] text-muted-foreground">{mode.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation buttons */}
                <div className="flex gap-3 justify-between pt-6 mt-6 border-t border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="gap-1 text-xs rounded-xl"
                  >
                    <ChevronLeft size={13} />
                    Back
                  </Button>

                  {currentStep === STEPS.length - 1 ? (
                    <Button size="sm" onClick={handleCreateBooking} className="gap-1 text-xs rounded-xl bg-primary text-white">
                      Confirm Booking
                    </Button>
                  ) : (
                    <Button size="sm" onClick={nextStep} className="gap-1 text-xs rounded-xl">
                      Next
                      <ChevronRight size={13} />
                    </Button>
                  )}
                </div>
              </div>

              {/* Booking Summary Sidebar (Right 1 col) */}
              <div className="space-y-5">
                <motion.div
                  variants={cardVariants}
                  className="bg-card rounded-2xl border border-border/50 p-5 space-y-4"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <h3 className="text-sm font-semibold text-foreground">Service Specification</h3>

                  <div className="space-y-3 pb-3 border-b border-border/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{serviceName}</p>
                        <p className="text-[10px] text-muted-foreground">Standard Package</p>
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        {formatCurrency(basePrice)}
                      </span>
                    </div>
                  </div>

                  {/* Dynamic details */}
                  {(selectedDate || selectedTime || selectedAddress) && (
                    <div className="space-y-2 pb-3 border-b border-border/50 text-xs">
                      {selectedDate && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarIcon size={12} />
                          <span>{selectedDate}</span>
                        </div>
                      )}
                      {selectedTime && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock size={12} />
                          <span>{selectedTime}</span>
                        </div>
                      )}
                      {selectedAddress && !showAddressForm && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <MapPin size={12} className="mt-0.5 shrink-0" />
                          <span className="line-clamp-1">
                            {addresses.find((a: any) => a.id === selectedAddress)?.line1}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Invoice Breakdown */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Item Subtotal</span>
                      <span>{formatCurrency(basePrice)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Platform Fee</span>
                      <span>{formatCurrency(49)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Taxes (GST)</span>
                      <span>{formatCurrency(50)}</span>
                    </div>
                    <div className="h-px bg-border/50 my-2" />
                    <div className="flex justify-between font-semibold text-sm text-foreground">
                      <span>Total Amount</span>
                      <span>{formatCurrency(basePrice + 99)}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading booking engine...</div>}>
      <BookingPageInner />
    </Suspense>
  );
}
