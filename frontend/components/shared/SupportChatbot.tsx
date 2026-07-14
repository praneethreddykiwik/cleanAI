'use client';

import React, { useState } from 'react';
import { Sparkles, Send, Upload, User, Loader2, AlertCircle, CheckCircle2, Ticket, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiCall } from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  image?: string;
  ticketId?: string;
  revisitScheduled?: boolean;
}

export function SupportChatbot({ onCancel }: { onCancel: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'support-welcome',
      sender: 'assistant',
      text: 'Hello Vivek 👋 I am your Support Assistant. If you have any issue with a recent service booking, please select the booking and upload a photo of the problem.',
    },
  ]);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Fetch recent customer bookings
  const { data: bookingsRes } = useQuery({
    queryKey: ['customer-bookings-support'],
    queryFn: () => apiCall('/bookings'),
  });
  const bookings = bookingsRes?.data || [];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!selectedBookingId) {
      toast.error('Please select a booking first.');
      return;
    }
    if (!inputText.trim() && !selectedImage) return;

    const userMsgId = Math.random().toString(36).substring(7);
    const userMessage: Message = {
      id: userMsgId,
      sender: 'user',
      text: inputText || 'Uploaded problem verification photo.',
      image: selectedImage || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const res = await apiCall('/ai/support', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: selectedBookingId,
          issueDescription: userMessage.text,
          image: userMessage.image || null,
        }),
      });

      if (!res.success) {
        throw new Error(res.message || 'Support request submission failed.');
      }

      const assistantMsgId = Math.random().toString(36).substring(7);
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          sender: 'assistant',
          text: res.message,
          ticketId: res.data.ticketId,
          revisitScheduled: res.data.revisitScheduled,
        },
      ]);
    } catch (e: any) {
      toast.error(e.message || 'AI Support Assistant encountered an error.');
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-support',
          sender: 'assistant',
          text: 'I could not log your ticket at this moment. Please double check that you have selected a valid booking.',
        },
      ]);
    } finally {
      setIsLoading(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col h-[480px] bg-card border border-border/50 rounded-2xl overflow-hidden shadow-xl z-20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-500/10 to-primary/5 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <Ticket size={14} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">CleanAI AI Help Desk</h3>
            <p className="text-[9px] text-muted-foreground font-semibold">Vision Verified Ticketing & Dispatch</p>
          </div>
        </div>
        <Button variant="ghost" size="xs" onClick={onCancel} className="text-[10px] rounded-full">
          Close Help Desk
        </Button>
      </div>

      {/* Booking Selector */}
      <div className="px-4 py-2 border-b border-border/20 bg-muted/20 flex flex-col gap-1.5">
        <label className="text-[9px] uppercase font-semibold text-muted-foreground">Select Booking to Report Issue</label>
        <select
          value={selectedBookingId}
          onChange={(e) => setSelectedBookingId(e.target.value)}
          className="w-full h-8 px-2 rounded-lg border border-border bg-background text-[11px] outline-none font-semibold text-foreground"
        >
          <option value="">-- Choose a recent service --</option>
          {bookings.map((b: any) => (
            <option key={b.id} value={b.id}>
              {b.bookingNumber} · {b.service?.name} ({formatDate(b.scheduledDate)})
            </option>
          ))}
        </select>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-2 max-w-[85%]',
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold border',
                msg.sender === 'user'
                  ? 'bg-primary border-primary text-white'
                  : 'bg-muted border-border text-muted-foreground'
              )}
            >
              {msg.sender === 'user' ? <User size={10} /> : <Sparkles size={10} />}
            </div>

            <div className="space-y-2">
              <div
                className={cn(
                  'px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed font-semibold shadow-3xs',
                  msg.sender === 'user'
                    ? 'bg-primary text-white rounded-tr-none'
                    : 'bg-card text-foreground border border-border/40 rounded-tl-none'
                )}
              >
                {msg.image && (
                  <div className="mb-2 max-w-xs rounded-xl overflow-hidden border border-white/20">
                    <img src={msg.image} alt="User Upload" className="w-full object-cover max-h-32" />
                  </div>
                )}
                <div>{msg.text}</div>
              </div>

              {/* RENDER SUCCESS / DISPATCH CARD */}
              {msg.revisitScheduled !== undefined && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    'p-3.5 rounded-xl border text-[11px] space-y-2 max-w-sm',
                    msg.revisitScheduled
                      ? 'border-green-500/20 bg-green-500/5 text-green-600 dark:text-green-400'
                      : 'border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400'
                  )}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {msg.revisitScheduled ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                    <span>{msg.revisitScheduled ? 'Free Revisit Dispatched' : 'Ticket Created'}</span>
                  </div>
                  <p className="font-semibold leading-relaxed">
                    {msg.revisitScheduled
                      ? 'AI vision verified quality issues. A free revisit is scheduled under warranty.'
                      : 'A support ticket has been created. A support executive will review the details soon.'}
                  </p>
                  <p className="text-[9px] text-muted-foreground font-semibold">
                    Ticket Ref ID: {msg.ticketId}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2 mr-auto items-center text-xs text-muted-foreground font-semibold">
            <Loader2 size={13} className="animate-spin text-primary" />
            <span>Support AI inspecting ticket assets...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Dock */}
      <div className="p-3 border-t border-border/30 bg-card space-y-2">
        {selectedImage && (
          <div className="flex items-center gap-2 p-1.5 bg-muted/40 border border-border/30 rounded-xl w-fit">
            <img src={selectedImage} alt="Attachment" className="w-8 h-8 object-cover rounded-lg" />
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="text-[10px] font-bold text-red-500 hover:text-red-600 px-1"
            >
              Remove
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full w-9 h-9 p-0 flex items-center justify-center shrink-0 border-border/60 hover:bg-muted"
          >
            <Upload size={14} className="text-muted-foreground/80" />
          </Button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={!selectedBookingId}
            placeholder={selectedBookingId ? "Type issue details here..." : "Select booking above to type..."}
            className="flex-1 h-9 px-3 rounded-full border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 font-semibold"
          />

          <Button
            type="button"
            size="xs"
            onClick={handleSend}
            disabled={isLoading || (!inputText.trim() && !selectedImage) || !selectedBookingId}
            className="rounded-full w-9 h-9 p-0 flex items-center justify-center shrink-0"
          >
            <Send size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}
