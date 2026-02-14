'use server';

import { createClient } from '@/lib/supabase/server';
import {
  ChecklistItem,
  DEFAULT_PREPARATION_CHECKLIST,
  DEFAULT_INSTALLATION_CHECKLIST,
} from '@/lib/schemas/checklist';

export async function getOrderChecklist(orderId: string) {
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select('preparation_checklist, installation_checklist')
    .eq('id', orderId)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
      data: null,
    };
  }

  return {
    success: true,
    data: {
      preparation: (order.preparation_checklist as ChecklistItem[] | null) ?? DEFAULT_PREPARATION_CHECKLIST,
      installation: (order.installation_checklist as ChecklistItem[] | null) ?? DEFAULT_INSTALLATION_CHECKLIST,
    },
  };
}

export async function updateOrderChecklist(
  orderId: string,
  type: 'preparation' | 'installation',
  items: ChecklistItem[]
) {
  const supabase = await createClient();

  const fieldName = type === 'preparation' ? 'preparation_checklist' : 'installation_checklist';

  const { error } = await supabase
    .from('orders')
    .update({ [fieldName]: items })
    .eq('id', orderId);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
  };
}

export async function resetOrderChecklist(
  orderId: string,
  type: 'preparation' | 'installation'
) {
  const defaultItems = type === 'preparation' ? DEFAULT_PREPARATION_CHECKLIST : DEFAULT_INSTALLATION_CHECKLIST;
  return updateOrderChecklist(orderId, type, defaultItems);
}
