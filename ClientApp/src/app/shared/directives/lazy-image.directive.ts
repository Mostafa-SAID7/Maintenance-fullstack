import { Directive, ElementRef, Input, Renderer2, OnInit } from '@angular/core';

@Directive({
  selector: '[appLazyImage]',
  standalone: true
})
export class LazyImageDirective implements OnInit {
  @Input() appLazyImage: string = '';
  @Input() placeholderSrc: string = 'assets/images/placeholder.png';

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    if ('IntersectionObserver' in window) {
      this.setupIntersectionObserver();
    } else {
      this.loadImage();
    }
  }

  private setupIntersectionObserver(): void {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadImage();
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '50px'
    });

    observer.observe(this.el.nativeElement);
  }

  private loadImage(): void {
    // Set placeholder initially
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.placeholderSrc);
    
    // Load actual image
    const img = new Image();
    img.onload = () => {
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.appLazyImage);
      this.renderer.addClass(this.el.nativeElement, 'loaded');
    };
    img.onerror = () => {
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.placeholderSrc);
      this.renderer.addClass(this.el.nativeElement, 'error');
    };
    img.src = this.appLazyImage;
  }
}