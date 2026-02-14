'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';
import type { PresetData } from '@/lib/schemas/closet-preset';

interface PresetCardProps {
  id: string;
  name: string;
  category: string;
  presetData: PresetData;
  isSystem: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function PresetCard({
  id,
  name,
  category,
  presetData,
  isSystem,
  onEdit,
  onDelete,
}: PresetCardProps) {
  const dimensions = `${presetData.width} x ${presetData.height} x ${presetData.depth} mm`;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{name}</CardTitle>
          {isSystem && (
            <Badge variant="secondary" className="text-xs">
              시스템
            </Badge>
          )}
        </div>
        <CardDescription className="text-sm">
          {category.replace(/_/g, ' ')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-1 text-sm text-muted-foreground">
          <div>
            <span className="font-medium">크기:</span> {dimensions}
          </div>
          <div>
            <span className="font-medium">재질:</span> {presetData.material}
          </div>
          <div>
            <span className="font-medium">형태:</span> {presetData.geometry}
          </div>
        </div>
      </CardContent>
      {!isSystem && (
        <CardFooter className="flex gap-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(id)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              수정
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onDelete(id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
