'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RotateCcw } from 'lucide-react';
import { ChecklistItem } from '@/lib/schemas/checklist';
import { updateOrderChecklist, resetOrderChecklist } from '@/app/(dashboard)/orders/checklist-actions';
import { toast } from 'sonner';

interface OrderChecklistProps {
  orderId: string;
  preparationItems: ChecklistItem[];
  installationItems: ChecklistItem[];
}

function getChecklistStatus(items: ChecklistItem[]): 'not-started' | 'in-progress' | 'completed' {
  const checkedCount = items.filter((item) => item.checked).length;
  if (checkedCount === 0) return 'not-started';
  if (checkedCount === items.length) return 'completed';
  return 'in-progress';
}

function getStatusBadge(status: 'not-started' | 'in-progress' | 'completed') {
  switch (status) {
    case 'not-started':
      return <Badge variant="outline">미시작</Badge>;
    case 'in-progress':
      return <Badge variant="secondary">진행중</Badge>;
    case 'completed':
      return <Badge variant="default">완료</Badge>;
  }
}

export function OrderChecklist({ orderId, preparationItems, installationItems }: OrderChecklistProps) {
  const [preparation, setPreparation] = useState<ChecklistItem[]>(preparationItems);
  const [installation, setInstallation] = useState<ChecklistItem[]>(installationItems);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setPreparation(preparationItems);
    setInstallation(installationItems);
  }, [preparationItems, installationItems]);

  const handleCheckToggle = (
    type: 'preparation' | 'installation',
    itemId: string,
    checked: boolean
  ) => {
    const items = type === 'preparation' ? preparation : installation;
    const setter = type === 'preparation' ? setPreparation : setInstallation;

    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, checked } : item
    );
    setter(updatedItems);

    // Debounce save
    if (saveTimeout) clearTimeout(saveTimeout);
    const timeout = setTimeout(async () => {
      const result = await updateOrderChecklist(orderId, type, updatedItems);
      if (!result.success) {
        toast.error('저장 실패', { description: result.error });
      }
    }, 500);
    setSaveTimeout(timeout);
  };

  const handleNoteChange = (
    type: 'preparation' | 'installation',
    itemId: string,
    note: string
  ) => {
    const items = type === 'preparation' ? preparation : installation;
    const setter = type === 'preparation' ? setPreparation : setInstallation;

    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, note } : item
    );
    setter(updatedItems);

    // Debounce save
    if (saveTimeout) clearTimeout(saveTimeout);
    const timeout = setTimeout(async () => {
      const result = await updateOrderChecklist(orderId, type, updatedItems);
      if (!result.success) {
        toast.error('저장 실패', { description: result.error });
      }
    }, 1000);
    setSaveTimeout(timeout);
  };

  const handleReset = async (type: 'preparation' | 'installation') => {
    const result = await resetOrderChecklist(orderId, type);
    if (result.success) {
      toast.success('초기화 완료', {
        description: '체크리스트가 기본 템플릿으로 초기화되었습니다.',
      });
      // Re-fetch would be ideal, but for now just reload
      window.location.reload();
    } else {
      toast.error('초기화 실패', { description: result.error });
    }
  };

  const prepStatus = getChecklistStatus(preparation);
  const instStatus = getChecklistStatus(installation);

  const prepProgress = preparation.filter((item) => item.checked).length;
  const instProgress = installation.filter((item) => item.checked).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>작업 체크리스트</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="preparation">
            <AccordionTrigger>
              <div className="flex items-center gap-3">
                <span>준비 체크리스트</span>
                {getStatusBadge(prepStatus)}
                <span className="text-sm text-muted-foreground">
                  ({prepProgress}/{preparation.length})
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    진행률: {preparation.length > 0 ? Math.round((prepProgress / preparation.length) * 100) : 0}%
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReset('preparation')}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    초기화
                  </Button>
                </div>
                <div className="space-y-3">
                  {preparation.map((item) => (
                    <div key={item.id} className="flex flex-col gap-2 border-b pb-3 last:border-0">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id={`prep-${item.id}`}
                          checked={item.checked}
                          onCheckedChange={(checked) =>
                            handleCheckToggle('preparation', item.id, checked === true)
                          }
                        />
                        <Label
                          htmlFor={`prep-${item.id}`}
                          className={`flex-1 cursor-pointer ${item.checked ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {item.label}
                        </Label>
                      </div>
                      <Input
                        placeholder="메모 (선택사항)"
                        value={item.note ?? ''}
                        onChange={(e) =>
                          handleNoteChange('preparation', item.id, e.target.value)
                        }
                        className="ml-6 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="installation">
            <AccordionTrigger>
              <div className="flex items-center gap-3">
                <span>설치 체크리스트</span>
                {getStatusBadge(instStatus)}
                <span className="text-sm text-muted-foreground">
                  ({instProgress}/{installation.length})
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    진행률: {installation.length > 0 ? Math.round((instProgress / installation.length) * 100) : 0}%
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReset('installation')}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    초기화
                  </Button>
                </div>
                <div className="space-y-3">
                  {installation.map((item) => (
                    <div key={item.id} className="flex flex-col gap-2 border-b pb-3 last:border-0">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id={`inst-${item.id}`}
                          checked={item.checked}
                          onCheckedChange={(checked) =>
                            handleCheckToggle('installation', item.id, checked === true)
                          }
                        />
                        <Label
                          htmlFor={`inst-${item.id}`}
                          className={`flex-1 cursor-pointer ${item.checked ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {item.label}
                        </Label>
                      </div>
                      <Input
                        placeholder="메모 (선택사항)"
                        value={item.note ?? ''}
                        onChange={(e) =>
                          handleNoteChange('installation', item.id, e.target.value)
                        }
                        className="ml-6 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
