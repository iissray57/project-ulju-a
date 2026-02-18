'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type Portfolio = {
  id: string;
  title: string;
  description: string | null;
  category: 'angle' | 'curtain' | 'system';
  images: string[];
  thumbnail_url: string | null;
  order_id: string | null;
  is_featured: boolean;
  is_visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export async function getPortfolios(): Promise<Portfolio[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch portfolios:', error);
    return [];
  }

  return data || [];
}

export async function createPortfolio(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as 'angle' | 'curtain' | 'system';
  const imagesJson = formData.get('images') as string;
  const images = imagesJson ? JSON.parse(imagesJson) : [];

  const { error } = await supabase.from('portfolios').insert({
    title,
    description: description || null,
    category,
    images,
    thumbnail_url: images[0] || null,
    is_visible: true,
    is_featured: false,
    display_order: 0,
  });

  if (error) {
    console.error('Failed to create portfolio:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/settings/portfolios');
  return { success: true };
}

export async function updatePortfolio(
  id: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as 'angle' | 'curtain' | 'system';
  const imagesJson = formData.get('images') as string;
  const images = imagesJson ? JSON.parse(imagesJson) : [];
  const is_visible = formData.get('is_visible') === 'true';
  const is_featured = formData.get('is_featured') === 'true';

  const { error } = await supabase
    .from('portfolios')
    .update({
      title,
      description: description || null,
      category,
      images,
      thumbnail_url: images[0] || null,
      is_visible,
      is_featured,
    })
    .eq('id', id);

  if (error) {
    console.error('Failed to update portfolio:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/settings/portfolios');
  return { success: true };
}

export async function deletePortfolio(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from('portfolios').delete().eq('id', id);

  if (error) {
    console.error('Failed to delete portfolio:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/settings/portfolios');
  return { success: true };
}

export async function toggleVisibility(id: string, is_visible: boolean): Promise<{ success: boolean }> {
  const supabase = await createClient();

  const { error } = await supabase.from('portfolios').update({ is_visible }).eq('id', id);

  if (error) {
    console.error('Failed to toggle visibility:', error);
    return { success: false };
  }

  revalidatePath('/settings/portfolios');
  return { success: true };
}

export async function toggleFeatured(id: string, is_featured: boolean): Promise<{ success: boolean }> {
  const supabase = await createClient();

  const { error } = await supabase.from('portfolios').update({ is_featured }).eq('id', id);

  if (error) {
    console.error('Failed to toggle featured:', error);
    return { success: false };
  }

  revalidatePath('/settings/portfolios');
  return { success: true };
}
