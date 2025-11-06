
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
