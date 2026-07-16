'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Upload, User, Loader2, Compass, AlertCircle, Wrench, CheckCircle2, ChevronRight, Camera, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiCall } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  image?: string;
  complexity?: any;
  pricing?: any;
  vendors?: any[];
  actions?: { label: string; onClick: () => void; variant?: 'default' | 'outline' }[];
}

interface AIChatInterfaceProps {
  serviceName: string;
  onBookingCreated: (bookingNumber: string) => void;
  addressId?: string;
  latitude?: number;
  longitude?: number;
  onCancel: () => void;
  onContinueBooking?: (aiValues: { complexity: any; pricing: any; selectedVendor: any }) => void;
}

export function AIChatInterface({
  serviceName,
  onBookingCreated,
  addressId,
  latitude,
  longitude,
  onCancel,
  onContinueBooking,
}: AIChatInterfaceProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hi Vivek 👋 I'm Criska AI, your home services operating system.\n\nTell me what is happening at your home today. You can:\n• Describe the problem\n• Upload photos`,
    },
  ]);
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Camera states
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Image compression utility
  const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  // Upload to Cloudinary helper
  const uploadImageToCloudinary = async (base64Str: string): Promise<string> => {
    try {
      const compressed = await compressImage(base64Str);
      const res = await apiCall('/users/upload', {
        method: 'POST',
        body: JSON.stringify({ fileContent: compressed }),
      });
      if (res.success && res.data?.url) {
        return res.data.url;
      }
    } catch (err) {
      console.error('Cloudinary upload failure, falling back to base64:', err);
    }
    return base64Str;
  };

  // Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files?.[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
        toast.success('Image pasted from clipboard.');
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success('Image dropped successfully.');
    }
  };

  // Camera functions
  const startCamera = async () => {
    try {
      if (cameraStream) stopCamera();
      const constraints = {
        video: { facingMode: facingMode }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((playErr) => {
          console.error('[Video Autoplay] Play method exception:', playErr);
        });
      }
      setShowCamera(true);
    } catch (err: any) {
      console.error('Camera access failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('Camera permission denied. Please allow camera access in browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        toast.error('No camera device found on this system.');
      } else {
        toast.error(`Could not access camera: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const switchCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    // Restart camera with new facing mode
    setTimeout(() => {
      if (showCamera) startCamera();
    }, 100);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setSelectedImage(dataUrl);
      stopCamera();
      toast.success('Photo captured successfully.');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
        toast.info('HEIC format detected. Converting format...');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;

    setIsLoading(true);
    setAgentStatus('Supervisor Agent: Coordinating workflows...');
    
    // Upload image to Cloudinary first if present
    let imageUrl = '';
    if (selectedImage) {
      imageUrl = await uploadImageToCloudinary(selectedImage);
    }

    const userMsgId = Math.random().toString(36).substring(7);
    const userMessage: Message = {
      id: userMsgId,
      sender: 'user',
      text: inputText || 'Uploaded a location photo.',
      image: selectedImage || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setSelectedImage(null);
    setTimeout(scrollToBottom, 50);

    try {
      // 1. Call unified chat orchestrator endpoint
      const response = await apiCall('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          text: currentInput,
          image: imageUrl || null,
          conversationId,
          serviceName,
          latitude,
          longitude,
        }),
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'AI processing failed.');
      }

      const { conversationId: newConvId, assistantText, stage, timelineLogs, complexity, pricing, vendors } = response.data;
      setConversationId(newConvId);

      // Simulate multi-turn agent timeline updates if pipeline executed
      if (stage === 'ANALYSIS_COMPLETE') {
        setAgentStatus('Vision Agent: Analyzing complexity details...');
        await new Promise((resolve) => setTimeout(resolve, 600));
        setAgentStatus('Pricing Agent: Calculating cost breakdown...');
        await new Promise((resolve) => setTimeout(resolve, 600));
        setAgentStatus('Vendor Matching Agent: Searching active providers...');
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      const assistantMsgId = Math.random().toString(36).substring(7);
      const assistantMessage: Message = {
        id: assistantMsgId,
        sender: 'assistant',
        text: assistantText,
        complexity: complexity || undefined,
        pricing: pricing || undefined,
        vendors: vendors || undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e: any) {
      toast.error(e.message || 'AI assistant encountered an error');
      setMessages((prev) => [
        ...prev,
        {
          id: 'error-reply',
          sender: 'assistant',
          text: 'Sorry, I had trouble parsing the details. Would you like to try describing it again?',
        },
      ]);
    } finally {
      setIsLoading(false);
      setAgentStatus(null);
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleBookVendor = async (vendor: any, pricing: any) => {
    if (onContinueBooking) {
      const lastMsg = [...messages].reverse().find((m) => m.complexity);
      onContinueBooking({
        complexity: lastMsg?.complexity || null,
        pricing: lastMsg?.pricing || pricing,
        selectedVendor: vendor,
      });
      return;
    }

    if (!addressId) {
      toast.error('Please configure a valid address before booking.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiCall('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: vendor.vendorId, // using matched vendor's database relation
          addressId,
          scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // scheduled tomorrow
          scheduledTime: '10:00 AM - 12:00 PM',
          notes: 'AI matches conversational booking',
          totalAmount: vendor.estimatedPrice,
          latitude: latitude || 12.9716,
          longitude: longitude || 77.5946,
        }),
      });

      if (res.success && res.data) {
        toast.success(`Booking created with ${vendor.businessName}!`);
        onBookingCreated(res.data.bookingNumber);
      } else {
        toast.error(res.message || 'Conversational booking failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'An error occurred during booking.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div onDragOver={handleDragOver} onDrop={handleDrop} className="flex flex-col h-[480px] bg-card border border-border/50 rounded-2xl overflow-hidden shadow-xl z-20 relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-500/10 to-primary/5 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles size={14} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">CleanAI Supervisor Agent</h3>
            <p className="text-[9px] text-muted-foreground font-semibold">Vision, Pricing, & Matching Coordinator</p>
          </div>
        </div>
        <Button variant="ghost" size="xs" onClick={onCancel} className="text-[10px] rounded-full">
          Close AI
        </Button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
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

            <div className="space-y-3">
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
                <div className="whitespace-pre-line">{msg.text}</div>
              </div>

              {/* RENDER DYNAMIC COMPLEXITY RESULTS */}
              {msg.complexity && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-muted/40 rounded-2xl border border-border/30 space-y-3.5 text-xs max-w-sm"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-border/20">
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <Wrench size={12} className="text-primary" /> Job Complexity
                    </span>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                      Confidence: {Math.round(msg.complexity.confidence * 100)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                    <div>
                      <span className="block text-[9px] uppercase font-semibold text-muted-foreground/60">Area Subcategory</span>
                      <span className="font-bold text-foreground truncate block">{msg.complexity.subcategory || 'General'}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-semibold text-muted-foreground/60">Severity / Difficulty</span>
                      <span className="font-bold text-foreground block">{msg.complexity.severity} / {msg.complexity.difficulty}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-semibold text-muted-foreground/60">Est. Duration</span>
                      <span className="font-bold text-foreground block">{msg.complexity.estimatedDuration}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase font-semibold text-muted-foreground/60">Workers Needed</span>
                      <span className="font-bold text-foreground block">{msg.complexity.workersRequired} Techs</span>
                    </div>
                  </div>

                  {msg.complexity.objectsDetected?.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-semibold text-muted-foreground/60 block">Detected Elements</span>
                      <div className="flex flex-wrap gap-1">
                        {msg.complexity.objectsDetected.map((obj: string) => (
                          <span key={obj} className="text-[10px] bg-card border border-border/30 px-2 py-0.5 rounded-md font-semibold text-foreground">
                            {obj}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {msg.pricing && (
                    <div className="pt-3 border-t border-border/20 space-y-2">
                      <span className="text-[9px] uppercase font-semibold text-muted-foreground/60 block">Transparent Cost Breakdown</span>
                      <div className="space-y-1 text-[11px] text-muted-foreground/80 font-semibold">
                        <div className="flex justify-between">
                          <span>Base Rate</span>
                          <span>{formatCurrency(msg.pricing.basePrice)}</span>
                        </div>
                        {msg.pricing.cityMultiplier !== 1 && (
                          <div className="flex justify-between text-muted-foreground/90">
                            <span>City Premium</span>
                            <span>x{msg.pricing.cityMultiplier}</span>
                          </div>
                        )}
                        {msg.pricing.demandMultiplier !== 1 && (
                          <div className="flex justify-between text-amber-600 dark:text-amber-400">
                            <span>Demand Surge</span>
                            <span>x{msg.pricing.demandMultiplier}</span>
                          </div>
                        )}
                        {msg.pricing.areaMultiplier !== 1 && (
                          <div className="flex justify-between text-muted-foreground/90">
                            <span>Area Multiplier</span>
                            <span>x{msg.pricing.areaMultiplier}</span>
                          </div>
                        )}
                        {msg.pricing.severityFee !== 0 && (
                          <div className={cn("flex justify-between", msg.pricing.severityFee < 0 ? "text-green-600 dark:text-green-400" : "text-red-500")}>
                            <span>Severity Adj.</span>
                            <span>{msg.pricing.severityFee < 0 ? '-' : '+'}{formatCurrency(Math.abs(msg.pricing.severityFee))}</span>
                          </div>
                        )}
                        {msg.pricing.weekendSurcharge > 0 && (
                          <div className="flex justify-between text-muted-foreground/90">
                            <span>Weekend Surcharge</span>
                            <span>{formatCurrency(msg.pricing.weekendSurcharge)}</span>
                          </div>
                        )}
                        {msg.pricing.nightCharge > 0 && (
                          <div className="flex justify-between text-amber-500 font-medium">
                            <span>Night Surcharge</span>
                            <span>{formatCurrency(msg.pricing.nightCharge)}</span>
                          </div>
                        )}
                        {msg.pricing.holidayCharge > 0 && (
                          <div className="flex justify-between text-indigo-500 font-medium">
                            <span>Holiday Surcharge</span>
                            <span>{formatCurrency(msg.pricing.holidayCharge)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-muted-foreground/90">
                          <span>Travel Allocation</span>
                          <span>{formatCurrency(msg.pricing.travelFee || 75)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Platform Fee</span>
                          <span>{formatCurrency(msg.pricing.platformFee)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>GST (18%)</span>
                          <span>{formatCurrency(msg.pricing.taxes)}</span>
                        </div>
                        <div className="flex justify-between border-t border-border/20 pt-1.5 font-bold text-foreground">
                          <span>Estimated Range</span>
                          <span>{formatCurrency(msg.pricing.totalMin)} – {formatCurrency(msg.pricing.totalMax)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* RENDER DYNAMIC VENDOR MATCHES */}
              {msg.vendors && msg.vendors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2.5 max-w-sm"
                >
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Available Vendor Matches</p>
                  {msg.vendors.map((vendor: any) => (
                    <div
                      key={vendor.vendorId}
                      className="p-3.5 bg-card border border-border/40 rounded-2xl flex flex-col gap-2.5 shadow-3xs"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground truncate">{vendor.businessName}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-bold">
                            {vendor.rating}★ · {vendor.distanceKm} km · {vendor.etaMinutes === 'ETA unavailable' ? 'ETA unavailable' : `ETA ${vendor.etaMinutes} min`}
                          </p>
                        </div>
                        <Button
                          size="xs"
                          onClick={() => handleBookVendor(vendor, msg.pricing)}
                          className="rounded-full gap-1 font-bold text-[10px] h-8 shrink-0 bg-primary"
                        >
                          Book - {formatCurrency(vendor.estimatedPrice)}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between text-[9px] bg-muted/40 px-2 py-1 rounded-lg border border-border/20 font-bold text-muted-foreground/90">
                        <span>Jobs: {vendor.completedJobs?.toLocaleString()}</span>
                        <span>Acceptance: {vendor.acceptanceRate}%</span>
                      </div>

                      <p className="text-[10px] text-primary bg-primary/5 px-2 py-1.5 rounded-lg border border-primary/10 font-bold leading-normal">
                        ✨ Reason: {vendor.reason}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}
              {msg.vendors && msg.vendors.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 bg-muted/40 border border-border/30 rounded-2xl max-w-sm text-xs space-y-2"
                >
                  <p className="font-bold text-foreground">No verified vendors available near your location.</p>
                  <Button size="xs" variant="outline" className="w-full text-[10px] font-bold rounded-xl" onClick={() => toast.success("We'll alert you as soon as providers launch here!")}>
                    Notify me when available
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="p-4 bg-muted/20 border border-border/30 rounded-2xl space-y-2.5 max-w-sm mr-auto mt-2">
            <div className="flex items-center gap-2">
              <Loader2 size={13} className="animate-spin text-primary" />
              <span className="text-[11px] font-bold text-foreground">{agentStatus}</span>
            </div>
            <div className="space-y-1 text-[10px] text-muted-foreground/80 font-semibold pl-5">
              <div className={cn("flex items-center gap-1.5", agentStatus?.includes('Vision') || agentStatus?.includes('Pricing') || agentStatus?.includes('Vendor') || agentStatus?.includes('Scheduling') ? "text-green-600 dark:text-green-400 font-bold" : "")}>
                {agentStatus?.includes('Supervisor') ? '⟳ Supervisor Orchestration' : '✓ Supervisor Orchestration'}
              </div>
              <div className={cn("flex items-center gap-1.5", agentStatus?.includes('Pricing') || agentStatus?.includes('Vendor') || agentStatus?.includes('Scheduling') ? "text-green-600 dark:text-green-400 font-bold" : "")}>
                {agentStatus?.includes('Supervisor') || agentStatus?.includes('Vision') ? '⟳ Vision complexity check' : '✓ Vision complexity check'}
              </div>
              <div className={cn("flex items-center gap-1.5", agentStatus?.includes('Vendor') || agentStatus?.includes('Scheduling') ? "text-green-600 dark:text-green-400 font-bold" : "")}>
                {agentStatus?.includes('Supervisor') || agentStatus?.includes('Vision') || agentStatus?.includes('Pricing') ? '⟳ Cost engine matrix calculation' : '✓ Cost engine matrix calculation'}
              </div>
              <div className={cn("flex items-center gap-1.5", agentStatus?.includes('Scheduling') ? "text-green-600 dark:text-green-400 font-bold" : "")}>
                {agentStatus?.includes('Supervisor') || agentStatus?.includes('Vision') || agentStatus?.includes('Pricing') || agentStatus?.includes('Vendor') ? '⟳ Vendor matching list search' : '✓ Vendor matching list search'}
              </div>
              <div className="flex items-center gap-1.5">
                {agentStatus?.includes('Scheduling') ? '⟳ Calendar scheduling check' : '✓ Calendar scheduling check'}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Camera Capture View Overlay */}
      {showCamera && (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-between p-4">
          <div className="w-full flex justify-between items-center text-white">
            <span className="text-xs font-bold">Camera Capture</span>
            <button onClick={stopCamera} className="p-1 hover:bg-white/10 rounded-full">
              <X size={18} />
            </button>
          </div>
          <div className="relative w-full max-h-[300px] flex items-center justify-center overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="flex items-center gap-6 pb-2">
            <button onClick={switchCamera} className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition-colors">
              <RefreshCw size={16} />
            </button>
            <button onClick={capturePhoto} className="w-12 h-12 bg-white hover:bg-neutral-200 border-4 border-neutral-700 rounded-full transition-transform active:scale-95" />
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>
      )}

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

          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={startCamera}
            className="rounded-full w-9 h-9 p-0 flex items-center justify-center shrink-0 border-border/60 hover:bg-muted"
          >
            <Camera size={14} className="text-muted-foreground/80" />
          </Button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your job request details..."
            className="flex-1 h-9 px-3 rounded-full border border-border bg-background text-xs outline-none focus:border-primary focus:ring-3 focus:ring-primary/10 font-semibold"
          />

          <Button
            type="button"
            size="xs"
            onClick={handleSend}
            disabled={isLoading || (!inputText.trim() && !selectedImage)}
            className="rounded-full w-9 h-9 p-0 flex items-center justify-center shrink-0"
          >
            <Send size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}
