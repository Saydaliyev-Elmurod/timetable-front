/**
 * Shared Components - Barrel Export
 * 
 * @module components/shared
 */

// Components
export { DataTable, createEditAction, createDeleteAction, createCloneAction, createViewAction } from './DataTable';
export { PageHeader } from './PageHeader';
export { SearchBar } from './SearchBar';
export { DeleteConfirmDialog } from './DeleteConfirmDialog';
export { TablePagination } from './TablePagination';
export { CrudPageHeader } from './CrudPageHeader';
export type { CrudAction, CrudPageHeaderProps } from './CrudPageHeader';
export { BulkActionBar } from './BulkActionBar';
export type { BulkAction, BulkActionBarProps } from './BulkActionBar';
export { btnPrimary, btnSecondary, btnDanger, inp, inpSearch, countText } from './crudStyles';

// Types
export * from './types';
