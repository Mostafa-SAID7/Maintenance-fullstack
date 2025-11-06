import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SearchBoxOptions {
  placeholder?: string;
  debounceTime?: number;
  minLength?: number;
  showClear?: boolean;
  showSearchIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'filled' | 'outline';
}

@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-box" [class]="containerClass">
      <div class="input-group" [class]="inputGroupClass">
        <span *ngIf="options.showSearchIcon !== false" class="input-group-text">
          <i class="fas fa-search"></i>
        </span>
        <input
          #searchInput
          type="text"
          class="form-control"
          [class]="inputClass"
          [placeholder]="options.placeholder || 'Search...'"
          [(ngModel)]="searchTerm"
          (input)="onInput($event)"
          (keydown.enter)="onEnter()"
          (keydown.esc)="onEscape()"
          (focus)="onInputFocus()"
          (blur)="onInputBlur()"
        />
        <button
          *ngIf="options.showClear !== false && searchTerm"
          class="btn btn-outline-secondary"
          type="button"
          (click)="onClear()"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .search-box {
      width: 100%;
      max-width: 400px;
    }

    .input-group-text {
      background-color: var(--bs-body-bg);
      border-right: none;
    }

    .form-control:focus {
      border-color: var(--bs-primary);
      box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25);
    }

    .btn-outline-secondary:hover {
      background-color: var(--bs-secondary);
      border-color: var(--bs-secondary);
      color: var(--bs-white);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBoxComponent {
  @ViewChild('searchInput', { static: false }) searchInput!: ElementRef<HTMLInputElement>;

  @Input() options: SearchBoxOptions = {};
  @Input() value: string = '';
  @Output() search = new EventEmitter<string>();
  @Output() valueChange = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();
  @Output() inputFocus = new EventEmitter<void>();
  @Output() inputBlur = new EventEmitter<void>();

  searchTerm: string = '';

  private debounceTimer: any;

  constructor() {
    // Initialize default options
    this.options = {
      debounceTime: 300,
      minLength: 0,
      showClear: true,
      showSearchIcon: true,
      size: 'medium',
      variant: 'default',
      ...this.options
    };
  }

  ngOnInit(): void {
    this.searchTerm = this.value || '';
  }

  ngOnChanges(): void {
    if (this.value !== this.searchTerm) {
      this.searchTerm = this.value || '';
    }
  }

  get containerClass(): string {
    return `search-box-${this.options.size}`;
  }

  get inputGroupClass(): string {
    const sizeClasses = {
      small: 'input-group-sm',
      medium: '',
      large: 'input-group-lg'
    };
    return sizeClasses[this.options.size || 'medium'];
  }

  get inputClass(): string {
    const variantClasses = {
      default: '',
      filled: 'bg-light',
      outline: 'border-start-0'
    };
    return variantClasses[this.options.variant || 'default'];
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.valueChange.emit(this.searchTerm);

    // Clear previous timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Debounce search
    if (this.searchTerm.length >= (this.options.minLength || 0)) {
      this.debounceTimer = setTimeout(() => {
        this.search.emit(this.searchTerm);
      }, this.options.debounceTime || 300);
    } else {
      // Emit empty search when below min length
      this.search.emit('');
    }
  }

  onEnter(): void {
    // Clear debounce and emit immediately
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.search.emit(this.searchTerm);
  }

  onEscape(): void {
    this.onClear();
    this.searchInput?.nativeElement.blur();
  }

  onClear(): void {
    this.searchTerm = '';
    this.valueChange.emit(this.searchTerm);
    this.clear.emit();
    this.search.emit('');

    // Focus the input after clearing
    setTimeout(() => {
      this.searchInput?.nativeElement.focus();
    }, 0);
  }

  onInputFocus(): void {
    this.inputFocus.emit();
  }

  onInputBlur(): void {
    this.inputBlur.emit();
  }

  focusInput(): void {
    this.searchInput?.nativeElement.focus();
  }

  blurInput(): void {
    this.searchInput?.nativeElement.blur();
  }

  setFocus(): void {
    this.focusInput();
  }
}