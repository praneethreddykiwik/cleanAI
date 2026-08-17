'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  User,
  MapPin,
  CreditCard,
  Lock,
  Bell,
  Trash2,
  Save,
  Plus,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { containerVariants, cardVariants } from '@/lib/animations';
import { toast } from 'sonner';
import { apiCall } from '@/lib/api';

export default function CustomerProfilePage() {
  const { user, updateUser } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'addresses' | 'payments' | 'security' | 'notifications' | 'delete'>('info');

  // Personal Info Form
  const [firstName, setFirstName] = useState(user?.firstName || 'Vivek');
  const [lastName, setLastName] = useState(user?.lastName || 'Shaganti');
  const [email, setEmail] = useState(user?.email || 'vivek@example.com');
  const [phone, setPhone] = useState(user?.phone || '9876543210');

  // Addresses State
  const [addresses, setAddresses] = useState([
    { id: '1', label: 'Home', line1: 'Flat 402, Block A, Prestige Heights', city: 'Bengaluru', pincode: '560001', isDefault: true },
    { id: '2', label: 'Office', line1: '4th Floor, Vercel Hub, Outer Ring Road', city: 'Bengaluru', pincode: '560103', isDefault: false },
  ]);

  // Payments State
  const [cards, setCards] = useState([
    { id: '1', brand: 'Visa', last4: '4242', expiry: '12/28', isDefault: true },
    { id: '2', brand: 'MasterCard', last4: '8888', expiry: '06/27', isDefault: false },
  ]);

  // Security Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Notifications State
  const [notifConfig, setNotifConfig] = useState({
    emailBookings: true,
    emailMarketing: false,
    smsBookings: true,
    pushOffers: true,
  });

  // Persist to the API. This used to call updateUser() only, which mutates
  // local React state — the change looked saved and then vanished on the next
  // load, because AuthContext refetches /auth/me on mount.
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInfo(true);
    try {
      // PATCH /users/me accepts firstName, lastName, phone and avatar.
      // Email is deliberately not updatable — it is the login identity.
      const res = await apiCall('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ firstName, lastName, phone }),
      });
      updateUser(res.data ?? { firstName, lastName, phone });
      toast.success('Personal information updated successfully.');
    } catch (err) {
      toast.error((err as Error).message || 'Could not update your profile.');
    } finally {
      setIsSavingInfo(false);
    }
  };

  // This previously changed nothing at all: it cleared the inputs and showed
  // "Password updated successfully" without issuing a single request, so the
  // old password kept working while the customer believed it had changed.
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match.");
      return;
    }
    if (!currentPassword) {
      toast.error('Enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }

    setIsChangingPassword(true);
    try {
      // apiCall throws on a non-2xx response, so failures land in catch.
      await apiCall('/users/me/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully.');
    } catch (err) {
      toast.error((err as Error).message || 'Could not update your password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggleNotif = (key: keyof typeof notifConfig) => {
    setNotifConfig((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success('Notification preferences updated.');
  };

  const handleDeleteAccount = () => {
    toast.error('Account deletion requires contacting support at support@cleanai.in');
  };

  return (
    <DashboardLayout
      role="customer"
      breadcrumbs={[{ label: 'Customer Portal' }, { label: 'Profile Settings' }]}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl mx-auto space-y-6"
      >
        <div>
          <h2 className="text-2xl font-bold text-foreground">Profile Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your personal data, saved locations, security, and alerts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sub Navigation Sidebar */}
          <div className="space-y-1 bg-card border border-border/50 p-2 rounded-2xl h-fit">
            {[
              { id: 'info', label: 'Personal Info', icon: User },
              { id: 'addresses', label: 'Addresses', icon: MapPin },
              { id: 'payments', label: 'Payment Methods', icon: CreditCard },
              { id: 'security', label: 'Security & Password', icon: Lock },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'delete', label: 'Delete Account', icon: Trash2, danger: true },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as 'info' | 'addresses' | 'payments' | 'security' | 'notifications' | 'delete')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeSubTab === tab.id
                    ? tab.danger
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-primary/5 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/40 border border-transparent'
                }`}
              >
                <tab.icon size={14} className={tab.danger && activeSubTab === tab.id ? 'text-red-600' : ''} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form Content Area */}
          <div className="md:col-span-3 bg-card border border-border/50 p-6 rounded-2xl min-h-[350px]">
            <AnimatePresence mode="wait">
              {activeSubTab === 'info' && (
                <motion.form
                  key="info"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  onSubmit={handleSaveInfo}
                  className="space-y-4"
                >
                  <h3 className="text-sm font-bold text-foreground">Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                      />
                    </div>
                  </div>
                  <Button type="submit" size="sm" className="gap-1.5 rounded-xl mt-4">
                    <Save size={13} /> Save Changes
                  </Button>
                </motion.form>
              )}

              {activeSubTab === 'addresses' && (
                <motion.div
                  key="addresses"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-foreground">Saved Addresses</h3>
                    <Button size="xs" variant="outline" className="gap-1 rounded-lg">
                      <Plus size={12} /> Add Address
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-4 border border-border/60 rounded-xl bg-background flex justify-between items-start"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            {addr.label}
                            {addr.isDefault && (
                              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">
                                Default
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{addr.line1}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {addr.city} · {addr.pincode}
                          </p>
                        </div>
                        <Button variant="ghost" size="xs" className="text-red-600 hover:bg-red-50 rounded-lg">
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeSubTab === 'payments' && (
                <motion.div
                  key="payments"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-foreground">Saved Cards</h3>
                    <Button size="xs" variant="outline" className="gap-1 rounded-lg">
                      <Plus size={12} /> Add Card
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {cards.map((card) => (
                      <div
                        key={card.id}
                        className="p-4 border border-border/60 rounded-xl bg-background flex justify-between items-center"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">💳</span>
                          <div>
                            <p className="text-xs font-bold text-foreground">
                              {card.brand} ending in {card.last4}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Expires {card.expiry}</p>
                          </div>
                        </div>
                        {card.isDefault ? (
                          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">
                            Primary
                          </span>
                        ) : (
                          <Button variant="ghost" size="xs" className="text-muted-foreground rounded-lg">
                            Make Primary
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeSubTab === 'security' && (
                <motion.form
                  key="security"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  onSubmit={handleUpdatePassword}
                  className="space-y-4"
                >
                  <h3 className="text-sm font-bold text-foreground">Security Settings</h3>
                  <div className="space-y-3 max-w-sm">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Current Password</label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                      />
                    </div>
                  </div>
                  <Button type="submit" size="sm" className="gap-1.5 rounded-xl mt-4">
                    <Save size={13} /> Update Password
                  </Button>
                </motion.form>
              )}

              {activeSubTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  <h3 className="text-sm font-bold text-foreground">Notification Preferences</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'emailBookings', label: 'Booking Confirmation Emails', desc: 'Receive transactional emails for order placement, acceptances, and updates.' },
                      { key: 'emailMarketing', label: 'Marketing and Promotional Emails', desc: 'Receive custom offers, sales, and newsletter updates.' },
                      { key: 'smsBookings', label: 'SMS / Whatsapp Status Alerts', desc: 'Get direct mobile notifications when service agents start work or complete task.' },
                      { key: 'pushOffers', label: 'In-app push notifications', desc: 'Get updates on active notifications, system status, and offers.' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-start justify-between gap-4 py-2 border-b border-border/50 last:border-0">
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-foreground">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground max-w-lg leading-relaxed">{item.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleNotif(item.key as keyof typeof notifConfig)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 shrink-0 ${
                            notifConfig[item.key as keyof typeof notifConfig] ? 'bg-primary' : 'bg-muted border border-border/60'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                              notifConfig[item.key as keyof typeof notifConfig] ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeSubTab === 'delete' && (
                <motion.div
                  key="delete"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-5"
                >
                  <div className="flex items-start gap-3 p-4 border border-red-200 rounded-xl bg-red-50 text-red-800">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-bold">Dangerous Action</p>
                      <p className="leading-relaxed">
                        Deleting your account will erase all active subscriptions, booking history, addresses, and saved credentials. This action is permanent and cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Type <span className="font-mono text-red-600 bg-red-50 px-1 py-0.5 rounded">DELETE</span> to confirm:
                    </p>
                    <input
                      type="text"
                      placeholder="DELETE"
                      className="w-full h-9 max-w-xs px-3 rounded-xl border border-red-200 bg-background text-xs outline-none focus:border-red-500 focus:ring-3 focus:ring-red-100"
                    />
                  </div>

                  <Button size="sm" variant="destructive" onClick={handleDeleteAccount} className="gap-1.5 rounded-xl">
                    <Trash2 size={13} /> Permanent Account Deletion
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
