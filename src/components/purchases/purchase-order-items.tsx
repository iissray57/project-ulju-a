'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  addPurchaseOrderItem,
  updatePurchaseOrderItem,
  removePurchaseOrderItem,
} from '@/app/(dashboard)/purchases/actions';
import type { Database } from '@/lib/database.types';
import { toast } from 'sonner';

type PurchaseOrderItem = Database['public']['Tables']['purchase_order_items']['Row'];

interface PurchaseOrderItemsProps {
  poId: string;
  items: PurchaseOrderItem[];
}

interface ItemFormData {
  product_id?: string;
  quantity: number;
  unit_price: number;
  memo?: string;
}

export function PurchaseOrderItems({ poId, items }: PurchaseOrderItemsProps) {
  const router = useRouter();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<PurchaseOrderItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ItemFormData>({
    quantity: 1,
    unit_price: 0,
  });

  // 금액 포맷
  const formatCurrency = (value: number) => {
    return value.toLocaleString('ko-KR');
  };

  // 소계 계산
  const calculateSubtotal = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  // 전체 합계
  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const resetForm = () => {
    setFormData({
      quantity: 1,
      unit_price: 0,
    });
  };

  const handleAdd = async () => {
    if (formData.quantity <= 0 || formData.unit_price < 0) {
      toast.error('수량과 단가를 확인해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addPurchaseOrderItem(poId, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('품목이 추가되었습니다.');
        setShowAddDialog(false);
        resetForm();
        router.refresh();
      }
    } catch {
      toast.error('품목 추가 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingItem) return;
    if (formData.quantity <= 0 || formData.unit_price < 0) {
      toast.error('수량과 단가를 확인해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updatePurchaseOrderItem(editingItem.id, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('품목이 수정되었습니다.');
        setShowEditDialog(false);
        setEditingItem(null);
        resetForm();
        router.refresh();
      }
    } catch {
      toast.error('품목 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('정말 이 품목을 삭제하시겠습니까?')) return;

    try {
      const result = await removePurchaseOrderItem(itemId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('품목이 삭제되었습니다.');
        router.refresh();
      }
    } catch {
      toast.error('품목 삭제 중 오류가 발생했습니다.');
    }
  };

  const openEditDialog = (item: PurchaseOrderItem) => {
    setEditingItem(item);
    setFormData({
      product_id: item.product_id ?? undefined,
      quantity: item.quantity,
      unit_price: item.unit_price,
      memo: item.memo ?? undefined,
    });
    setShowEditDialog(true);
  };

  const closeEditDialog = () => {
    setShowEditDialog(false);
    setEditingItem(null);
    resetForm();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">발주 품목</h3>
        <Button onClick={() => setShowAddDialog(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          품목 추가
        </Button>
      </div>

      {/* Items Table */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          발주 품목이 없습니다
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제품ID</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead className="text-right">단가</TableHead>
                <TableHead className="text-right">소계</TableHead>
                <TableHead>메모</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">
                    {item.product_id ? item.product_id.slice(0, 8) + '...' : '-'}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    ₩{formatCurrency(item.unit_price)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₩{formatCurrency(calculateSubtotal(item.quantity, item.unit_price))}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {item.memo || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Total */}
          <div className="border-t bg-muted/50 px-6 py-3 flex justify-end items-center gap-4">
            <span className="text-sm font-medium">합계:</span>
            <span className="text-lg font-bold">₩{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>품목 추가</DialogTitle>
            <DialogDescription>발주 품목을 추가합니다.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">수량</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_price">단가 (원)</Label>
              <Input
                id="unit_price"
                type="number"
                min="0"
                value={formData.unit_price}
                onChange={(e) =>
                  setFormData({ ...formData, unit_price: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memo">메모</Label>
              <Textarea
                id="memo"
                value={formData.memo || ''}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                rows={2}
              />
            </div>

            <div className="p-3 bg-muted rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">소계:</span>
                <span className="font-semibold">
                  ₩{formatCurrency(calculateSubtotal(formData.quantity, formData.unit_price))}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              취소
            </Button>
            <Button onClick={handleAdd} disabled={isSubmitting}>
              {isSubmitting ? '추가 중...' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={closeEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>품목 수정</DialogTitle>
            <DialogDescription>발주 품목 정보를 수정합니다.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_quantity">수량</Label>
              <Input
                id="edit_quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_unit_price">단가 (원)</Label>
              <Input
                id="edit_unit_price"
                type="number"
                min="0"
                value={formData.unit_price}
                onChange={(e) =>
                  setFormData({ ...formData, unit_price: parseInt(e.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_memo">메모</Label>
              <Textarea
                id="edit_memo"
                value={formData.memo || ''}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                rows={2}
              />
            </div>

            <div className="p-3 bg-muted rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">소계:</span>
                <span className="font-semibold">
                  ₩{formatCurrency(calculateSubtotal(formData.quantity, formData.unit_price))}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              취소
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? '수정 중...' : '수정'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
