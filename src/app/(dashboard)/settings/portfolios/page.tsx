'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, Eye, EyeOff, Star, ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  getPortfolios,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  toggleVisibility,
  toggleFeatured,
  type Portfolio,
} from './actions';

const CATEGORIES = [
  { value: 'angle', label: '앵글' },
  { value: 'curtain', label: '커튼' },
  { value: 'system', label: '시스템' },
] as const;

type FormData = {
  title: string;
  description: string;
  category: 'angle' | 'curtain' | 'system';
  images: string[];
};

const initialFormData: FormData = {
  title: '',
  description: '',
  category: 'angle',
  images: [],
};

export default function PortfoliosSettingsPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  const loadPortfolios = useCallback(async () => {
    setIsLoading(true);
    const data = await getPortfolios();
    setPortfolios(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadPortfolios();
  }, [loadPortfolios]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (portfolio: Portfolio) => {
    setEditingId(portfolio.id);
    setFormData({
      title: portfolio.title,
      description: portfolio.description || '',
      category: portfolio.category,
      images: portfolio.images || [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('제목을 입력해주세요');
      return;
    }

    setIsSaving(true);

    const fd = new window.FormData();
    fd.append('title', formData.title);
    fd.append('description', formData.description);
    fd.append('category', formData.category);
    fd.append('images', JSON.stringify(formData.images));

    let result;
    if (editingId) {
      const editing = portfolios.find((p) => p.id === editingId);
      fd.append('is_visible', String(editing?.is_visible ?? true));
      fd.append('is_featured', String(editing?.is_featured ?? false));
      result = await updatePortfolio(editingId, fd);
    } else {
      result = await createPortfolio(fd);
    }

    setIsSaving(false);

    if (result.success) {
      toast.success(editingId ? '수정되었습니다' : '추가되었습니다');
      setIsDialogOpen(false);
      loadPortfolios();
    } else {
      toast.error(result.error || '저장 실패');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    const result = await deletePortfolio(deletingId);
    if (result.success) {
      toast.success('삭제되었습니다');
      loadPortfolios();
    } else {
      toast.error('삭제 실패');
    }
    setIsDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleToggleVisibility = async (portfolio: Portfolio) => {
    const result = await toggleVisibility(portfolio.id, !portfolio.is_visible);
    if (result.success) {
      loadPortfolios();
    }
  };

  const handleToggleFeatured = async (portfolio: Portfolio) => {
    const result = await toggleFeatured(portfolio.id, !portfolio.is_featured);
    if (result.success) {
      loadPortfolios();
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">포트폴리오 관리</h1>
          <p className="text-muted-foreground mt-2">
            랜딩페이지에 표시할 시공 사례를 관리합니다.
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          추가
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : portfolios.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            등록된 포트폴리오가 없습니다.
            <br />
            <Button variant="link" onClick={handleOpenCreate}>
              첫 번째 포트폴리오 추가하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {portfolios.map((portfolio) => (
            <Card key={portfolio.id} className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {portfolio.thumbnail_url ? (
                  <img
                    src={portfolio.thumbnail_url}
                    alt={portfolio.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImagePlus className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute right-2 top-2 flex gap-1">
                  <Button
                    variant={portfolio.is_featured ? 'default' : 'secondary'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggleFeatured(portfolio)}
                    title={portfolio.is_featured ? '추천 해제' : '추천'}
                  >
                    <Star className={`h-4 w-4 ${portfolio.is_featured ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    variant={portfolio.is_visible ? 'secondary' : 'outline'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggleVisibility(portfolio)}
                    title={portfolio.is_visible ? '숨기기' : '표시'}
                  >
                    {portfolio.is_visible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{portfolio.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {CATEGORIES.find((c) => c.value === portfolio.category)?.label}
                      {portfolio.images.length > 0 && ` · ${portfolio.images.length}장`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(portfolio)}>
                      수정
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => {
                        setDeletingId(portfolio.id);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? '포트폴리오 수정' : '포트폴리오 추가'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="예: 거실 우드블라인드"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">카테고리 *</Label>
              <Select
                value={formData.category}
                onValueChange={(v) =>
                  setFormData({ ...formData, category: v as 'angle' | 'curtain' | 'system' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="시공 내용에 대한 설명"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>이미지</Label>
              <ImageUploader
                images={formData.images}
                onChange={(images) => setFormData({ ...formData, images })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>포트폴리오 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 포트폴리오를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Image Uploader Component
function ImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('JPG, PNG, WebP 이미지만 업로드 가능합니다');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('이미지 크기는 5MB 이하여야 합니다');
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('로그인이 필요합니다');
        return;
      }

      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `portfolios/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) {
        // 버킷이 없으면 purchase-images 버킷 사용
        const { error: fallbackError } = await supabase.storage
          .from('purchase-images')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (fallbackError) {
          console.error('Upload error:', fallbackError);
          toast.error('이미지 업로드 실패');
          return;
        }

        const { data: { publicUrl } } = supabase.storage.from('purchase-images').getPublicUrl(fileName);
        onChange([...images, publicUrl]);
      } else {
        const { data: { publicUrl } } = supabase.storage.from('portfolio-images').getPublicUrl(fileName);
        onChange([...images, publicUrl]);
      }

      toast.success('이미지가 업로드되었습니다');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('이미지 업로드 중 오류 발생');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => uploadImage(file));
    }
    e.target.value = '';
  };

  const handleRemove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, index) => (
            <div key={index} className="group relative aspect-square overflow-hidden rounded-md bg-muted">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
              {index === 0 && (
                <div className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                  대표
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ImagePlus className="mr-2 h-4 w-4" />
        )}
        이미지 추가
      </Button>
    </div>
  );
}
