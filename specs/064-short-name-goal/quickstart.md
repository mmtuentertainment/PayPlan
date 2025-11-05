# Quick Start Guide: Goal Tracking Dashboard

**Feature**: Goal Tracking Dashboard (Feature 064)
**Created**: 2025-11-05
**Purpose**: Developer quick-start with Shadcn component examples and integration patterns

---

## Shadcn Component Usage Examples

### Example 1: Metric Cards (Shadcn Card + Dashboard Pattern)

```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { TrendingUp } from 'lucide-react';
import type { DashboardMetrics } from '@/features/goals/types';
import { formatCentsAsUSD } from '@/shared/lib/currency';

function GoalMetrics({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">Total Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.totalGoals}</div>
          <p className="text-xs text-gray-500 flex items-center mt-1">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            +1 this month
          </p>
        </CardContent>
      </Card>

      {/* Total Saved (Hero Metric) */}
      <Card className="border-2 border-green-600">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">Total Saved</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {formatCentsAsUSD(metrics.totalSaved)}
          </div>
          <p className="text-xs text-gray-500">Across all active goals</p>
        </CardContent>
      </Card>

      {/* Goals On Track */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">Goals On Track</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">
            {metrics.goalsOnTrack} / {metrics.totalGoals}
          </div>
          <p className="text-xs text-gray-500">&gt;25% progress</p>
        </CardContent>
      </Card>

      {/* Average Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">Avg Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{metrics.averageProgress.toFixed(1)}%</div>
          <p className="text-xs text-gray-500">Across all goals</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### Example 2: Goal Progress Bar (Shadcn Progress)

```typescript
import { Progress } from '@/shared/components/ui/progress';
import { Badge } from '@/shared/components/ui/badge';
import type { Goal } from '@/features/goals/types';
import { getGoalPercent, getGoalStatus } from '@/features/goals/lib/calculations';
import { formatCentsAsUSD } from '@/shared/lib/currency';

function GoalCard({ goal }: { goal: Goal }) {
  const percentage = getGoalPercent(goal); // CLAMPED to 100%
  const status = getGoalStatus(goal);

  // Color based on percentage
  const progressColor = percentage >= 95 ? 'bg-yellow-500' : 'bg-green-600';

  // Badge based on status
  const statusBadge = {
    'completed': { label: 'Complete', variant: 'success' as const },
    'on-track': { label: 'On Track', variant: 'default' as const },
    'at-risk': { label: 'Behind Schedule', variant: 'destructive' as const },
    'past-due': { label: 'Past Due', variant: 'destructive' as const },
  }[status];

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">{goal.name}</h3>
        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
      </div>

      {/* Shadcn Progress Component */}
      <Progress
        value={percentage}
        className={`h-2 ${progressColor}`}
        aria-label={`${goal.name} progress: ${percentage}%`}
      />

      <p className="text-sm text-gray-600 mt-2">
        {formatCentsAsUSD(goal.currentAmount)} of {formatCentsAsUSD(goal.targetAmount)} ({percentage.toFixed(1)}%)
      </p>
    </div>
  );
}
```

---

### Example 3: Toast with Undo (Shadcn Toast)

```typescript
import { useToast } from '@/shared/components/ui/use-toast';
import { Button } from '@/shared/components/ui/button';

function QuickAddSection({ goal }: { goal: Goal }) {
  const { toast } = useToast();
  const [previousState, setPreviousState] = useState<Goal | null>(null);

  const handleQuickAdd = (amountCents: number) => {
    // Save previous state for undo
    setPreviousState({ ...goal });

    // Add contribution
    const updated = addContribution(goal.id, amountCents);

    // Show toast with undo
    toast({
      title: "Contribution added!",
      description: `Added ${formatCentsAsUSD(amountCents)} to ${goal.name}`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (previousState) {
              // Revert to previous state
              updateGoal(goal.id, previousState);
              toast({
                title: "Undone",
                description: "Contribution reverted",
              });
            }
          }}
        >
          Undo
        </Button>
      ),
      duration: 5000, // 5-second undo window
    });
  };

  return (
    <div className="flex gap-2">
      <Button onClick={() => handleQuickAdd(500)}>Add $5</Button>
      <Button onClick={() => handleQuickAdd(1000)}>Add $10</Button>
      <Button onClick={() => handleQuickAdd(2500)}>Add $25</Button>
    </div>
  );
}
```

---

### Example 4: Empty State (Shadcn Empty)

```typescript
import { Empty } from '@/shared/components/ui/empty';
import { Button } from '@/shared/components/ui/button';
import { Plus } from 'lucide-react';

function GoalEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Empty
      icon={<Plus className="h-12 w-12 text-gray-400" />}
      title="No goals yet"
      description="Create your first savings goal to start tracking your financial progress"
      action={
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Goal
        </Button>
      }
    />
  );
}
```

---

### Example 5: Loading Skeleton (Shadcn Skeleton)

```typescript
import { Skeleton } from '@/shared/components/ui/skeleton';

function GoalSkeleton() {
  return (
    <div className="space-y-4">
      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-6 border rounded-lg">
            <Skeleton className="h-4 w-20 mb-4" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>

      {/* Goal list skeleton */}
      {[1, 2, 3].map(i => (
        <div key={i} className="p-4 border rounded-lg">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-2 w-full mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}
```

---

### Example 6: Goal Form (Shadcn Dialog)

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';

function GoalForm({ isOpen, onClose, onSubmit }: GoalFormProps) {
  const [formData, setFormData] = useState({ name: '', targetAmount: '', targetDate: '', monthlyContribution: '' });

  const handleSubmit = () => {
    onSubmit({
      name: formData.name,
      targetAmount: Math.round(parseFloat(formData.targetAmount) * 100), // Convert to cents
      targetDate: formData.targetDate || null,
      monthlyContribution: formData.monthlyContribution
        ? Math.round(parseFloat(formData.monthlyContribution) * 100)
        : null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Goal Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Emergency Fund"
            />
          </div>

          <div>
            <Label htmlFor="target">Target Amount</Label>
            <Input
              id="target"
              type="number"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              placeholder="1000.00"
            />
          </div>

          <div>
            <Label htmlFor="date">Target Date (optional)</Label>
            <Input
              id="date"
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Create Goal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Common Patterns

### Pattern 1: Traffic Light Colors (Tailwind Classes)

```typescript
// Status badge colors
const statusColors = {
  'complete': 'bg-green-100 text-green-800',
  'on-track': 'bg-blue-100 text-blue-800',
  'almost-there': 'bg-yellow-100 text-yellow-800',
  'behind': 'bg-red-100 text-red-800',
  'just-started': 'bg-gray-100 text-gray-800',
};

// Progress bar colors
const progressColors = {
  green: 'bg-green-600',   // 0-94%
  yellow: 'bg-yellow-500', // 95-99%
  blue: 'bg-blue-600',     // 100%+
};
```

### Pattern 2: Import formatCurrency from Budgets Feature

```typescript
// Cross-feature import (PayPlan allows this)
import { formatCurrency } from '@/features/budgets';

// Usage
<p>{formatCurrency(goal.targetAmount)}</p>  // "$1,000.00"
```

### Pattern 3: Memoize Expensive Calculations

```typescript
import { useMemo } from 'react';

function GoalMetrics() {
  const goals = useGoals();

  const metrics = useMemo(() => computeDashboardMetrics(goals), [goals]);

  return <MetricCards metrics={metrics} />;
}
```

---

## References

- **Spec**: [spec.md](spec.md)
- **Data Model**: [data-model.md](data-model.md)
- **Research**: [research.md](research.md)
- **Shadcn Docs**: https://ui.shadcn.com/docs/components - Component documentation
- **Shadcn Examples**: https://ui.shadcn.com/examples/dashboard - dashboard-01 pattern reference
