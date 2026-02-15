import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScheduleForm } from '@/components/schedule/schedule-form';
import { ArrowLeft } from 'lucide-react';

export default function NewSchedulePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/schedule">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">신규 일정 등록</h1>
          <p className="text-muted-foreground mt-1">새로운 일정을 등록합니다.</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <ScheduleForm />
      </div>
    </div>
  );
}
