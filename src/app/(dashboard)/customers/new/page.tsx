import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerForm } from '@/components/customers/customer-form';

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">신규 고객 등록</h1>
          <p className="text-muted-foreground mt-2">새로운 고객 정보를 등록합니다</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/customers">목록으로</Link>
        </Button>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>고객 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm />
        </CardContent>
      </Card>
    </div>
  );
}
