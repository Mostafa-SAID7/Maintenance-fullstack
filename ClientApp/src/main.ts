import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideZoneChangeDetection } from '@angular/core';

// Import application configuration
import { routes } from './app/config/app.routes';

// Import root component
import { AppComponent } from './app/app.component';

// Bootstrap the Angular application
bootstrapApplication(AppComponent, {
  providers: [
    // Core providers
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // Router configuration
    provideRouter(routes),
    
    // HTTP Client
    provideHttpClient(),
    
    // Animation providers
    provideAnimations()
  ]
}).catch(err => {
  // Global error handling for bootstrap failures
  console.error('Error starting Car Maintenance System application:', err);
  
  // Display user-friendly error message
  const errorDiv = document.createElement('div');
  errorDiv.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      text-align: center;
      padding: 2rem;
      background-color: #f8fafc;
      color: #1e293b;
    ">
      <div style="
        background-color: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        max-width: 500px;
        width: 100%;
      ">
        <h1 style="color: #ef4444; margin-bottom: 1rem;">Application Error</h1>
        <p style="margin-bottom: 1.5rem; color: #64748b;">
          The Car Maintenance System application failed to load.
        </p>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <button 
            onclick="window.location.reload()"
            style="
              background-color: #3b82f6;
              color: white;
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 0.5rem;
              cursor: pointer;
              font-weight: 500;
            "
          >
            Reload Application
          </button>
          <button 
            onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload();"
            style="
              background-color: #6b7280;
              color: white;
              padding: 0.75rem 1.5rem;
              border: none;
              border-radius: 0.5rem;
              cursor: pointer;
              font-weight: 500;
            "
          >
            Clear Cache & Reload
          </button>
        </div>
        <details style="margin-top: 1.5rem; text-align: left;">
          <summary style="cursor: pointer; color: #64748b;">Technical Details</summary>
          <pre style="background-color: #f1f5f9; padding: 1rem; border-radius: 0.375rem; font-size: 0.875rem; overflow-x: auto; margin-top: 0.5rem;">
${err.stack || err.message || 'Unknown error occurred'}
          </pre>
        </details>
      </div>
    </div>
  `;
  document.body.appendChild(errorDiv);
  
  // Re-throw for development
  throw err;
});