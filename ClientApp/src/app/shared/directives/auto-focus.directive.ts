import { Directive, ElementRef, AfterViewInit, Input } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true
})
export class AutoFocusDirective implements AfterViewInit {
  @Input() appAutoFocus = true;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    if (this.appAutoFocus) {
      setTimeout(() => {
        this.el.nativeElement.focus();
      }, 100);
    }
  }
}