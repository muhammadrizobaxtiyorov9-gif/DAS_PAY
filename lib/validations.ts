import { z } from 'zod';

/**
 * Contact form validation schema
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  phone: z
    .string()
    .min(9, 'Phone number must be at least 9 digits')
    .max(20, 'Phone number must be less than 20 characters')
    .regex(/^[\d\s+()-]+$/, 'Invalid phone number format'),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  service: z
    .string()
    .optional(),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters'),
  fromStation: z.string().optional(),
  toStation: z.string().optional(),
  transportType: z.string().optional(),
  honeypot: z.string().max(0, 'Bot detected').optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

/**
 * Tracking form validation schema
 */
export const trackingFormSchema = z.object({
  trackingCode: z
    .string()
    .min(5, 'Tracking code must be at least 5 characters')
    .max(30, 'Tracking code must be less than 30 characters')
    .regex(/^[A-Za-z0-9\-\s]+$/, 'Tracking code can only contain letters, numbers, spaces, and hyphens'),
});

export type TrackingFormData = z.infer<typeof trackingFormSchema>;

/**
 * Service types for contact form dropdown
 */
export const serviceTypes = [
  { value: 'road', labelKey: 'services.items.road.title' },
  { value: 'warehouse', labelKey: 'services.items.warehouse.title' },
  { value: 'international', labelKey: 'services.items.international.title' },
  { value: 'air', labelKey: 'services.items.air.title' },
  { value: 'rail', labelKey: 'services.items.rail.title' },
  { value: 'customs', labelKey: 'services.items.customs.title' },
] as const;

export type ServiceType = (typeof serviceTypes)[number]['value'];
