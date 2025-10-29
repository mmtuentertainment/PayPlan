/**
 * Categories Page
 *
 * Feature: 061-spending-categories-budgets
 * User Story: US1 - Manage Spending Categories
 *
 * Main page for viewing and managing spending categories.
 * Displays category list, allows create/edit/delete operations.
 *
 * Accessibility: WCAG 2.1 AA
 * - Keyboard navigation (Tab, Enter, Escape)
 * - Screen reader support (ARIA roles, labels, live regions)
 * - Focus management
 * - Responsive design (mobile-first)
 */

import { useState } from 'react';
import { type Category, type CreateCategoryInput } from '@/types/category';
import { useCategories } from '@/hooks/useCategories';
import { CategoryList } from '@/components/categories/CategoryList';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { DeleteCategoryDialog } from '@/components/categories/DeleteCategoryDialog';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Plus, AlertCircle } from 'lucide-react';

/**
 * Categories page component.
 * Manages category CRUD operations with localStorage persistence.
 */
export function Categories() {
  const { categories, loading, error, createCategory, updateCategory, deleteCategory } =
    useCategories();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Handle create button click
  const handleCreateClick = () => {
    setFormMode('create');
    setSelectedCategory(null);
    setFormOpen(true);
  };

  // Handle edit button click
  const handleEdit = (category: Category) => {
    setFormMode('edit');
    setSelectedCategory(category);
    setFormOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  // Handle form submit (create or edit)
  const handleFormSubmit = async (input: CreateCategoryInput) => {
    if (formMode === 'create') {
      await createCategory(input);
    } else if (selectedCategory) {
      await updateCategory(selectedCategory.id, input);
    }
    setFormOpen(false);
  };

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (categoryToDelete) {
      await deleteCategory(categoryToDelete.id);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  // Calculate transaction counts (placeholder until we have transactions)
  // TODO: Replace with actual transaction counts when transaction feature is implemented
  const transactionCounts: Record<string, number> = {};

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label="Loading categories"
      >
        <span className="text-lg text-muted-foreground">Loading categories...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spending Categories</h1>
          <p className="mt-2 text-muted-foreground">
            Organize your transactions by creating custom spending categories.
          </p>
        </div>
        <Button onClick={handleCreateClick} size="lg" aria-label="Create new category">
          <Plus className="mr-2 h-5 w-5" aria-hidden="true" />
          New Category
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <span className="ml-2">{error}</span>
        </Alert>
      )}

      {/* Category Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Total Categories</div>
          <div className="mt-2 text-3xl font-bold">{categories.length}</div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Pre-defined</div>
          <div className="mt-2 text-3xl font-bold">
            {categories.filter((cat) => cat.isDefault).length}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Custom</div>
          <div className="mt-2 text-3xl font-bold">
            {categories.filter((cat) => !cat.isDefault).length}
          </div>
        </div>
      </div>

      {/* Category List */}
      <CategoryList
        categories={categories}
        transactionCounts={transactionCounts}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      {/* Category Form Dialog */}
      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        category={selectedCategory}
        mode={formMode}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteCategoryDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        category={categoryToDelete}
        transactionCount={categoryToDelete ? transactionCounts[categoryToDelete.id] || 0 : 0}
        budgetCount={0} // TODO: Get actual budget count when budget feature is complete
      />
    </div>
  );
}

export default Categories;
