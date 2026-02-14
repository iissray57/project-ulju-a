import { z } from 'zod';

export const TRANSACTION_TYPES = [
  'inbound',
  'outbound',
  'hold',
  'release_hold',
  'adjustment',
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  inbound: '입고',
  outbound: '출고',
  hold: 'hold',
  release_hold: 'hold 해제',
  adjustment: '조정',
};

export const inventoryAdjustSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int(),
  memo: z.string().optional(),
});

export const inventoryInboundSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive('수량은 1 이상이어야 합니다'),
  purchase_order_id: z.string().uuid().optional(),
  memo: z.string().optional(),
});

export const inventorySearchSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  lowStockOnly: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
});

export const inventoryTransactionSearchSchema = z.object({
  productId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
});

export type InventoryAdjustData = z.infer<typeof inventoryAdjustSchema>;
export type InventoryInboundData = z.infer<typeof inventoryInboundSchema>;
export type InventorySearchParams = z.infer<typeof inventorySearchSchema>;
export type InventoryTransactionSearchParams = z.infer<
  typeof inventoryTransactionSearchSchema
>;
