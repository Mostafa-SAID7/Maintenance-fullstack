import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <div class="error-icon">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 class="error-title">404 - Page Not Found</h1>
        <p class="error-message">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        <div class="error-actions">
          <button class="btn btn-primary" routerLink="/dashboard">
            Go to Dashboard
          </button>
          <button class="btn btn-secondary" (click)="goBack()">
            Go Back
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      padding: var(--spacing-xl);
    }
    
    .not-found-content {
      text-align: center;
      max-width: 500px;
    }
    
    .error-icon {
      color: var(--text-muted);
      margin-bottom: var(--spacing-lg);
    }
    
    .error-title {
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: var(--spacing-md);
      color: var(--text-primary);
    }
    
    .error-message {
      font-size: 1rem;
      color: var(--text-secondary);
      margin-bottom: var(--spacing-xl);
      line-height: var(--line-height-relaxed);
    }
    
    .error-actions {
      display: flex;
      gap: var(--spacing-md);
      justify-content: center;
      flex-wrap: wrap;
    }
    
    @media (max-width: 767px) {
      .error-actions {
        flex-direction: column;
      }
    }
  `]
})
export class NotFoundComponent {
  
  goBack(): void {
    window.history.back();
  }
}