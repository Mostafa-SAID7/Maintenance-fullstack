import { Injectable } from '@angular/core';
import { CanDeactivate, CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';

export interface UnsavedChangesComponent {
  hasUnsavedChanges(): boolean;
  onSave?(): Promise<boolean>;
  onDiscard?(): void;
}

export interface UnsavedChangesConfig {
  message?: string;
  saveText?: string;
  discardText?: string;
  cancelText?: string;
  autoSave?: boolean;
  showDialog?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UnsavedChangesGuard implements CanDeactivate<UnsavedChangesComponent>, CanActivate {

  private pendingChanges = new Set<string>();
  private dialogElement: HTMLDialogElement | null = null;

  constructor(private router: Router) {
    this.createDialogElement();
  }

  canDeactivate(
    component: UnsavedChangesComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState?: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkUnsavedChanges(component, nextState?.url || currentState.url);
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    // For guard-based protection, check if the route has unsaved changes
    const routePath = this.getRoutePath(route);
    
    if (this.hasUnsavedChanges(routePath)) {
      return this.showUnsavedChangesDialog({
        message: 'You have unsaved changes. Are you sure you want to leave?',
        saveText: 'Save & Continue',
        discardText: 'Discard & Continue',
        cancelText: 'Stay Here'
      });
    }

    return of(true);
  }

  /**
   * Mark a route as having unsaved changes
   */
  markAsDirty(routePath: string): void {
    this.pendingChanges.add(routePath);
    this.updateBrowserTitle();
  }

  /**
   * Clear unsaved changes for a route
   */
  markAsClean(routePath: string): void {
    this.pendingChanges.delete(routePath);
    this.updateBrowserTitle();
  }

  /**
   * Check if a route has unsaved changes
   */
  hasUnsavedChanges(routePath?: string): boolean {
    if (routePath) {
      return this.pendingChanges.has(routePath);
    }
    return this.pendingChanges.size > 0;
  }

  /**
   * Get all routes with unsaved changes
   */
  getDirtyRoutes(): string[] {
    return Array.from(this.pendingChanges);
  }

  /**
   * Clear all pending changes
   */
  clearAll(): void {
    this.pendingChanges.clear();
    this.updateBrowserTitle();
  }

  /**
   * Check unsaved changes and show dialog if needed
   */
  private async checkUnsavedChanges(component: UnsavedChangesComponent, nextUrl?: string): Promise<boolean> {
    if (!component.hasUnsavedChanges()) {
      return true;
    }

    const shouldLeave = await this.showUnsavedChangesDialog({
      message: 'You have unsaved changes. Are you sure you want to leave?',
      saveText: 'Save',
      discardText: 'Discard',
      cancelText: 'Cancel'
    });

    if (shouldLeave && component.onDiscard) {
      component.onDiscard();
      this.markAsClean(this.getCurrentRoutePath());
    }

    return shouldLeave;
  }

  /**
   * Show unsaved changes dialog
   */
  private showUnsavedChangesDialog(config: UnsavedChangesConfig): Promise<boolean> {
    return new Promise((resolve) => {
      if (config.showDialog === false) {
        resolve(true);
        return;
      }

      this.createDialogElement();
      
      const dialog = this.dialogElement!;
      const message = config.message || 'You have unsaved changes.';
      
      dialog.innerHTML = `
        <div class="unsaved-changes-dialog">
          <div class="dialog-header">
            <h3>Unsaved Changes</h3>
          </div>
          <div class="dialog-content">
            <p>${message}</p>
          </div>
          <div class="dialog-actions">
            ${config.cancelText ? `<button class="btn btn-secondary" data-action="cancel">${config.cancelText}</button>` : ''}
            ${config.discardText ? `<button class="btn btn-warning" data-action="discard">${config.discardText}</button>` : ''}
            ${config.saveText ? `<button class="btn btn-primary" data-action="save">${config.saveText}</button>` : ''}
          </div>
        </div>
      `;

      // Add styles
      this.addDialogStyles();

      // Handle button clicks
      const handleClick = (event: Event) => {
        const target = event.target as HTMLElement;
        const action = target.getAttribute('data-action');
        
        if (action) {
          event.preventDefault();
          dialog.close();
          
          switch (action) {
            case 'cancel':
              resolve(false);
              break;
            case 'discard':
              resolve(true);
              break;
            case 'save':
              this.handleSaveAction().then(() => {
                resolve(true);
              }).catch(() => {
                resolve(false);
              });
              break;
          }
        }
      };

      dialog.addEventListener('click', handleClick);
      
      // Handle escape key
      const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          dialog.close();
          resolve(false);
        }
      };

      dialog.addEventListener('keydown', handleKeydown);
      
      // Clean up listeners when dialog closes
      dialog.addEventListener('close', () => {
        dialog.removeEventListener('click', handleClick);
        dialog.removeEventListener('keydown', handleKeydown);
      });

      // Show dialog
      dialog.showModal();
    });
  }

  /**
   * Handle save action
   */
  private async handleSaveAction(): Promise<void> {
    // This would integrate with the component's onSave method
    // For now, we'll just simulate a save delay
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Changes saved');
        this.clearAll();
        resolve();
      }, 1000);
    });
  }

  /**
   * Create dialog element if it doesn't exist
   */
  private createDialogElement(): void {
    if (!this.dialogElement) {
      this.dialogElement = document.createElement('dialog');
      this.dialogElement.id = 'unsaved-changes-dialog';
      this.dialogElement.style.border = 'none';
      this.dialogElement.style.borderRadius = '8px';
      this.dialogElement.style.padding = '0';
      this.dialogElement.style.maxWidth = '400px';
      this.dialogElement.style.width = '90%';
      
      document.body.appendChild(this.dialogElement);
    }
  }

  /**
   * Add styles for the dialog
   */
  private addDialogStyles(): void {
    if (!document.getElementById('unsaved-changes-styles')) {
      const style = document.createElement('style');
      style.id = 'unsaved-changes-styles';
      style.textContent = `
        .unsaved-changes-dialog {
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .dialog-header h3 {
          margin: 0 0 15px 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }
        
        .dialog-content p {
          margin: 0 0 20px 0;
          color: #666;
          line-height: 1.5;
        }
        
        .dialog-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }
        
        .dialog-actions button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .btn-primary {
          background-color: #007bff;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #0056b3;
        }
        
        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }
        
        .btn-secondary:hover {
          background-color: #545b62;
        }
        
        .btn-warning {
          background-color: #ffc107;
          color: #212529;
        }
        
        .btn-warning:hover {
          background-color: #e0a800;
        }
        
        dialog::backdrop {
          background-color: rgba(0, 0, 0, 0.5);
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Get current route path
   */
  private getCurrentRoutePath(): string {
    return this.router.url;
  }

  /**
   * Get route path from activated route snapshot
   */
  private getRoutePath(route: ActivatedRouteSnapshot): string {
    let path = '';
    let current = route;
    
    while (current) {
      if (current.routeConfig?.path) {
        path = path ? `${current.routeConfig.path}/${path}` : current.routeConfig.path;
      }
      current = current.firstChild!;
    }
    
    return path || '/';
  }

  /**
   * Update browser title to indicate unsaved changes
   */
  private updateBrowserTitle(): void {
    const baseTitle = 'CarCommun';
    
    if (this.pendingChanges.size > 0) {
      document.title = `● ${baseTitle}`; // ● indicates unsaved changes
    } else {
      document.title = baseTitle;
    }
  }

  /**
   * Set up automatic detection for form changes
   */
  setupFormMonitoring(formSelector: string, routePath: string): void {
    const forms = document.querySelectorAll(formSelector);
    
    forms.forEach(form => {
      const formElement = form as HTMLFormElement;
      
      // Monitor input changes
      formElement.addEventListener('input', () => {
        this.markAsDirty(routePath);
      });
      
      // Monitor checkbox changes
      formElement.addEventListener('change', () => {
        this.markAsDirty(routePath);
      });
      
      // Reset dirty state on form submission
      formElement.addEventListener('submit', () => {
        this.markAsClean(routePath);
      });
    });
  }

  /**
   * Clean up form monitoring
   */
  cleanupFormMonitoring(formSelector: string): void {
    const forms = document.querySelectorAll(formSelector);
    
    forms.forEach(form => {
      const formElement = form as HTMLFormElement;
      const newForm = formElement.cloneNode(true) as HTMLFormElement;
      formElement.parentNode?.replaceChild(newForm, formElement);
    });
  }

  /**
   * Check if current navigation is within the app
   */
  private isInternalNavigation(nextUrl?: string): boolean {
    if (!nextUrl) return false;
    
    // Check if it's an external URL
    if (nextUrl.startsWith('http://') || nextUrl.startsWith('https://') || nextUrl.startsWith('mailto:') || nextUrl.startsWith('tel:')) {
      return false;
    }
    
    return true;
  }

  /**
   * Get pending changes summary
   */
  getPendingChangesSummary(): { count: number; routes: string[] } {
    return {
      count: this.pendingChanges.size,
      routes: Array.from(this.pendingChanges)
    };
  }

  /**
   * Auto-save functionality
   */
  async autoSave(routePath: string, saveFunction: () => Promise<any>): Promise<void> {
    try {
      await saveFunction();
      this.markAsClean(routePath);
      console.log(`Auto-saved changes for route: ${routePath}`);
    } catch (error) {
      console.error(`Auto-save failed for route: ${routePath}`, error);
    }
  }

  /**
   * Cleanup when guard is destroyed
   */
  ngOnDestroy(): void {
    if (this.dialogElement) {
      document.body.removeChild(this.dialogElement);
      this.dialogElement = null;
    }
  }
}