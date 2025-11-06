import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-overview-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overview-cards-container">
      <h2 class="text-2xl font-bold mb-6">Overview Cards</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Cards will be dynamically generated here -->
        <div class="text-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <i class="fas fa-chart-line text-4xl text-blue-500 mb-4"></i>
          <h3 class="text-lg font-semibold mb-2">Analytics Dashboard</h3>
          <p class="text-gray-600 dark:text-gray-400">Detailed analytics coming soon</p>
        </div>
      </div>
    </div>
  `
})
export class OverviewCardsComponent {}