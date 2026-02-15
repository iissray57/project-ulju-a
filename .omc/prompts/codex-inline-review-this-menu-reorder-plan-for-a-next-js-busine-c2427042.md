Review this menu reorder plan for a Next.js business management app.

## Plan Summary
- Keep flat menu structure (no hierarchical categories) for 1-person business UX
- Reorder menus to match business workflow: 대시보드 → 고객관리 → 수주관리 → 스케줄 → 재고관리 → 발주관리 → 매출/매입 → 리포트
- Only change: Move 고객관리 before 수주관리 (customer registration before orders)
- Files to modify: src/components/layout/sidebar.tsx (navItems array order)

## Current navItems in sidebar.tsx:
```javascript
const navItems = [
  { href: '/', label: '대시보드', icon: Home },
  { href: '/orders', label: '수주관리', icon: ClipboardList },
  { href: '/customers', label: '고객관리', icon: Users },
  { href: '/schedule', label: '스케줄', icon: Calendar },
  { href: '/inventory', label: '재고관리', icon: Package },
  { href: '/purchases', label: '발주관리', icon: ShoppingCart },
  { href: '/finance', label: '매출/매입', icon: DollarSign },
  { href: '/reports', label: '리포트', icon: FileText },
];
```

## Evaluate:
1. Is the plan complete and clear?
2. Are there any missing considerations (mobile bottom-tab-bar, tests, etc.)?
3. Any risks or issues?

Respond with: APPROVED, REVISE (with feedback), or REJECT