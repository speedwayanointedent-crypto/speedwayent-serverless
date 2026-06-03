"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, MessageCircle, Loader2, Send, Clock, CheckCircle, HeadphonesIcon } from "lucide-react";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSubmitting(false);
    setSubmitted(true);
  };

  const contactInfo = [
    {
      icon: Phone,
      label: "Phone",
      value: "+233 50 000 0000",
      description: "Mon - Sat, 8am - 6pm",
      color: "primary"
    },
    {
      icon: Mail,
      label: "Email",
      value: "support@speedway.example",
      description: "We'll reply within 24 hours",
      color: "primary"
    },
    {
      icon: MapPin,
      label: "Visit Us",
      value: "Accra, Ghana",
      description: "Abossey-Okai, Main Street",
      color: "primary"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900">
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:pt-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <MessageCircle className="w-4 h-4" />
            Get in Touch
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
            We're Here to Help
          </h1>
          <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Have questions about parts, fitment, or orders? Our team is ready to assist you.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <Link href="/shop" className="btn-primary">
            Browse Parts
          </Link>
          <WhatsAppButton label="Chat on WhatsApp" className="h-11" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] max-w-6xl mx-auto">
          <Card className="p-6 sm:p-8" padding="none">
            <div className="p-6 sm:p-8 border-b border-border">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Send us a Message</h2>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Fill out the form below and we'll get back to you as soon as possible.
              </p>
            </div>

            {submitted ? (
              <div className="p-6 sm:p-8 text-center py-12">
                <div className="mx-auto w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
                  <CheckCircle className="w-10 h-10 text-success" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Message Sent!</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Thank you for reaching out. Our team will respond within 24 hours.
                </p>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Full Name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="+233 50 000 0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                  <Select
                    label="Subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    options={[
                      { value: "", label: "Select a subject" },
                      { value: "parts", label: "Part Inquiry" },
                      { value: "fitment", label: "Fitment Help" },
                      { value: "order", label: "Order Status" },
                      { value: "return", label: "Returns & Refunds" },
                      { value: "other", label: "Other" }
                    ]}
                  />
                </div>

                <Textarea
                  label="Message"
                  placeholder="Tell us about the part you need or how we can help..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  className="w-full h-12 text-base"
                  icon={<Send className="w-5 h-5" />}
                  iconPosition="right"
                >
                  {submitting ? "Sending..." : "Send Message"}
                </Button>

                <p className="text-center text-xs text-slate-400">
                  By submitting, you agree to our privacy policy and terms of service.
                </p>
              </form>
            )}
          </Card>

          <div className="space-y-5">
            {contactInfo.map((item, index) => (
              <Card
                key={item.label}
                hover
                className="p-5 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-${item.color}-100 dark:bg-${item.color}-900/20 text-${item.color}-600 dark:text-${item.color}-400`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{item.value}</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{item.description}</p>
                  </div>
                </div>
              </Card>
            ))}

            <Card className="bg-gradient-to-br from-primary to-primary/80 p-6 text-white border-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                  <HeadphonesIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold">Need Immediate Help?</p>
                  <p className="text-sm text-white/70">Average response: Under 10 mins</p>
                </div>
              </div>
              <p className="text-sm text-white/80 mb-4">
                For quickest assistance with parts lookup, fitment verification, or order status, chat with us on WhatsApp.
              </p>
              <WhatsAppButton
                label="Chat on WhatsApp"
                className="w-full h-11 bg-white text-primary hover:bg-white/90"
              />
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Business Hours</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Monday - Friday</span>
                  <span className="font-medium">8:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Saturday</span>
                  <span className="font-medium">9:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sunday</span>
                  <span className="font-medium text-slate-400">Closed</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
