import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit, OnDestroy {
  @Input() appHasRole: string | string[] = [];

  private subscription?: Subscription;

  constructor(
    private el: ElementRef<HTMLElement>,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.subscription = this.authService.currentUser$.subscribe(user => {
      this.updateVisibility(user);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private updateVisibility(user: any): void {
    const roles = Array.isArray(this.appHasRole) ? this.appHasRole : [this.appHasRole];
    const hasRequiredRole = roles.some(role => this.authService.hasRole(role));
    
    if (hasRequiredRole) {
      this.el.nativeElement.style.display = '';
    } else {
      this.el.nativeElement.style.display = 'none';
    }
  }
}