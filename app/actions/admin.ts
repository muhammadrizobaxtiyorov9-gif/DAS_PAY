'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// --- LEADS ---

export async function updateLeadStatus(id: number, status: string, assignedToId?: number) {
  try {
    await prisma.lead.update({
      where: { id },
      data: { status, assignedToId }
    });
    revalidatePath('/[locale]/admin/leads', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteLead(id: number) {
  try {
    await prisma.lead.delete({
      where: { id }
    });
    revalidatePath('/[locale]/admin/leads', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- CONTRACTS ---

export async function deleteContract(id: number) {
  try {
    await prisma.contract.delete({
      where: { id }
    });
    revalidatePath('/[locale]/admin/contracts', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- SHIPMENTS ---

export async function createShipment(data: {
  trackingCode: string;
  senderName: string;
  receiverName: string;
  origin: string;
  destination: string;
  status: string;
  weight?: number;
  description?: string;
  clientPhone?: string;
}) {
  try {
    await prisma.shipment.create({
      data
    });
    revalidatePath('/[locale]/admin/shipments', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateShipment(id: number, data: {
  trackingCode: string;
  senderName: string;
  receiverName: string;
  origin: string;
  destination: string;
  status: string;
  weight?: number;
  description?: string;
  clientPhone?: string;
}) {
  try {
    await prisma.shipment.update({
      where: { id },
      data
    });
    revalidatePath('/[locale]/admin/shipments', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteShipment(id: number) {
  try {
    await prisma.shipment.delete({
      where: { id }
    });
    revalidatePath('/[locale]/admin/shipments', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- BLOG POSTS ---

export async function createBlogPost(data: any) {
  try {
    await prisma.blogPost.create({
      data
    });
    revalidatePath('/[locale]/admin/blog', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateBlogPost(id: number, data: any) {
  try {
    await prisma.blogPost.update({
      where: { id },
      data
    });
    revalidatePath('/[locale]/admin/blog', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteBlogPost(id: number) {
  try {
    await prisma.blogPost.delete({
      where: { id }
    });
    revalidatePath('/[locale]/admin/blog', 'page');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
