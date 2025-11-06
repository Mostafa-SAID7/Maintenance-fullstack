// This file serves as a barrel export for shared components, directives, pipes, and utilities
// All components are standalone and can be imported directly into feature modules

// Angular modules that should be available throughout the app
export { CommonModule } from '@angular/common';
export { FormsModule, ReactiveFormsModule } from '@angular/forms';
export { RouterModule } from '@angular/router';

// UI Components (standalone)
export { LoadingSpinnerComponent } from './components/ui/loading-spinner/loading-spinner.component';
export { ConfirmDialogComponent } from './components/ui/confirm-dialog/confirm-dialog.component';
export { SearchBoxComponent } from './components/ui/search-box/search-box.component';
export { DataTableComponent } from './components/ui/data-table/data-table.component';
export { PaginationComponent } from './components/ui/pagination/pagination.component';
export { FileUploadComponent } from './components/ui/file-upload/file-upload.component';
export { ImageGalleryComponent } from './components/ui/image-gallery/image-gallery.component';
export { QrCodeComponent } from './components/ui/qr-code/qr-code.component';

// Directives (standalone)
export { ClickOutsideDirective } from './directives/click-outside.directive';
export { NumbersOnlyDirective } from './directives/numbers-only.directive';
export { AutoFocusDirective } from './directives/auto-focus.directive';
export { HasRoleDirective } from './directives/has-role.directive';
export { LazyImageDirective } from './directives/lazy-image.directive';

// Pipes (standalone)
export { CurrencyFormatPipe } from './pipes/currency-format.pipe';
export { DateAgoPipe } from './pipes/date-ago.pipe';
export { MileageFormatPipe } from './pipes/mileage-format.pipe';
export { VinFormatterPipe } from './pipes/vin-formatter.pipe';
export { SafeHtmlPipe } from './pipes/safe-html.pipe';

// Utilities (non-standalone, just export classes)
export { FormUtils } from './utils/form-utils';
export { DateUtils } from './utils/date-utils';
export { FileUtils } from './utils/file-utils';

// Note: CalculationUtils and ChartUtils may not exist yet, commenting them out for now
// export { CalculationUtils } from './utils/calculation-utils';
// export { ChartUtils } from './utils/chart-utils';

// Note: Validators are exported as utility functions and should be used directly
// in form definitions, not as module exports

/**
 * Usage Example:
 *
 * In feature module standalone component:
 *
 * imports: [
 *   CommonModule,
 *   FormsModule,
 *   ReactiveFormsModule,
 *   RouterModule,
 *   LoadingSpinnerComponent,
 *   ConfirmDialogComponent,
 *   DataTableComponent,
 *   CurrencyFormatPipe,
 *   ClickOutsideDirective
 * ]
 */