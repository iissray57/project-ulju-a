import { SupplierForm } from '@/components/suppliers/supplier-form';

export default function NewSupplierPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">거래처 등록</h1>
        <p className="text-muted-foreground mt-2">새로운 거래처를 등록합니다</p>
      </div>

      <div className="max-w-2xl">
        <SupplierForm />
      </div>
    </div>
  );
}
