import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export type SpinnerSize = 'small' | 'medium' | 'large';
export type SpinnerColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="spinner-wrapper" [class]="wrapperClass">
      <div 
        class="spinner" 
        [class]="spinnerClass"
        [style.width.px]="sizePx"
        [style.height.px]="sizePx"
        [style.borderWidth.px]="borderWidth"
      ></div>
      <div *ngIf="message" class="spinner-message">{{ message }}</div>
    </div>
  `,
  styleUrls: ['./loading-spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingSpinnerComponent {
  @Input() size: SpinnerSize = 'medium';
  @Input() color: SpinnerColor = 'primary';
  @Input() message?: string;
  @Input() overlay = false;
  @Input() fullscreen = false;

  get sizePx(): number {
    const sizes = { small: 16, medium: 32, large: 48 };
    return sizes[this.size];
  }

  get borderWidth(): number {
    return Math.floor(this.sizePx / 8);
  }

  get wrapperClass(): string {
    return `spinner-${this.color} ${this.overlay ? 'overlay' : ''} ${this.fullscreen ? 'fullscreen' : ''}`;
  }

  get spinnerClass(): string {
    return `spinner-${this.size} spinner-${this.color}`;
  }
}