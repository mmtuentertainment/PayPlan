/**
 * TransactionCard Component
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US4 - Assign Transactions to Categories
 *
 * Displays a transaction with category icon, name, and quick actions.
 *
 * Accessibility: WCAG 2.1 AA
 */

import { type Transaction } from '@/types/transaction';
import { type Category } from '@/types/category';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import * as Icons from 'lucide-react';
import { formatCurrency } from '@/lib/budgets/calculations';
import { cn } from '@/lib/utils';

export interface TransactionCardProps {
  transaction: Transaction;
  category?: Category;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
  className?: string;
}

export function TransactionCard({
  transaction,
  category,
  onEdit,
  onDelete,
  className,
}: TransactionCardProps) {
  const isExpense = transaction.amount > 0;

  // Get category icon
  let CategoryIcon: any = Icons.HelpCircle;
  if (category) {
    const iconName = category.iconName
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
    CategoryIcon =
      (Icons as any)[iconName] ||
      Icons.HelpCircle;
  }

  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Left: Category + Description */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {category ? (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0"
                style={{ backgroundColor: `${category.color}20` }}
                aria-hidden="true"
              >
                <CategoryIcon className="h-5 w-5" style={{ color: category.color }} />
              </div>
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 flex-shrink-0"
                aria-hidden="true"
              >
                <Icons.HelpCircle className="h-5 w-5 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{transaction.description}</div>
              <div className="text-sm text-muted-foreground">
                {category ? category.name : 'Uncategorized'} • {transaction.date}
              </div>
            </div>
          </div>

          {/* Right: Amount + Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className={cn('text-right', isExpense ? 'text-red-600' : 'text-green-600')}>
              <div className="flex items-center gap-1 font-bold">
                {isExpense ? (
                  <TrendingDown className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{formatCurrency(Math.abs(transaction.amount))}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {isExpense ? 'Expense' : 'Income'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(transaction)}
                  aria-label={`Edit ${transaction.description}`}
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(transaction)}
                  aria-label={`Delete ${transaction.description}`}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
