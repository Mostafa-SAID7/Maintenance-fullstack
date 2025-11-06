import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface MaintenanceCostData {
  date: string;
  cost: number;
  category: string;
  carId?: string;
  carName?: string;
}

export interface CostAnalysis {
  totalCost: number;
  averageCost: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  mostExpensiveCategory: string;
  costByCategory: { category: string; cost: number }[];
  costByMonth: { month: string; cost: number }[];
}

@Component({
  selector: 'app-maintenance-cost-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="maintenance-cost-chart bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <!-- Chart Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Maintenance Cost Analysis</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">Track and analyze maintenance expenses over time</p>
        </div>
        <div class="flex space-x-2">
          <!-- Chart Type Toggle -->
          <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              type="button"
              (click)="changeChartType('line')"
              class="px-3 py-1 text-sm rounded-md transition-colors"
              [ngClass]="{
                'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow': chartType === 'line',
                'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white': chartType !== 'line'
              }"
            >
              Line
            </button>
            <button
              type="button"
              (click)="changeChartType('bar')"
              class="px-3 py-1 text-sm rounded-md transition-colors"
              [ngClass]="{
                'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow': chartType === 'bar',
                'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white': chartType !== 'bar'
              }"
            >
              Bar
            </button>
            <button
              type="button"
              (click)="changeChartType('pie')"
              class="px-3 py-1 text-sm rounded-md transition-colors"
              [ngClass]="{
                'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow': chartType === 'pie',
                'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white': chartType !== 'pie'
              }"
            >
              Pie
            </button>
          </div>
          
          <!-- Export Button -->
          <button
            type="button"
            (click)="exportChart()"
            class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
        </div>
      </div>

      <!-- Cost Summary Cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-6" *ngIf="analysis">
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Cost</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ analysis.totalCost | currency }}</p>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Average Cost</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ analysis.averageCost | currency }}</p>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg 
                class="h-6 w-6"
                [ngClass]="{
                  'text-red-500': analysis.trend === 'increasing',
                  'text-green-500': analysis.trend === 'decreasing',
                  'text-yellow-500': analysis.trend === 'stable'
                }"
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  [attr.d]="analysis.trend === 'increasing' ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' : 
                           analysis.trend === 'decreasing' ? 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6' :
                           'M9 5l7 7-7 7'" 
                />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Trend</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-white capitalize">{{ analysis.trend }}</p>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Top Category</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ analysis.mostExpensiveCategory }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart Container -->
      <div class="relative bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <canvas 
          #chartCanvas 
          class="w-full"
          [attr.width]="canvasWidth"
          [attr.height]="canvasHeight"
          (click)="onCanvasClick($event)"
        ></canvas>
        
        <!-- Loading Overlay -->
        <div *ngIf="isLoading" class="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 flex items-center justify-center rounded-lg">
          <div class="flex items-center space-x-2">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="text-gray-600 dark:text-gray-400">Loading chart data...</span>
          </div>
        </div>
      </div>

      <!-- Chart Legend -->
      <div class="mt-4 flex flex-wrap justify-center gap-4" *ngIf="chartData.length > 0">
        <div *ngFor="let item of legendItems; let i = index" class="flex items-center space-x-2">
          <div 
            class="w-4 h-4 rounded-full"
            [style.background-color]="item.color"
          ></div>
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ item.label }}</span>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && (!data || data.length === 0)" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No maintenance data</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Start tracking maintenance costs to see analytics.</p>
      </div>
    </div>
  `,
  styles: [`
    .maintenance-cost-chart {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    canvas {
      display: block;
    }
  `]
})
export class MaintenanceCostChartComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  @Input() data: MaintenanceCostData[] = [];
  @Input() chartType: 'line' | 'bar' | 'pie' = 'line';
  @Input() height = 400;
  @Input() width = 800;
  @Input() title = 'Maintenance Cost Analysis';
  @Input() showExport = true;
  @Input() groupBy: 'month' | 'category' | 'car' = 'month';
  
  @Output() dataPointClick = new EventEmitter<MaintenanceCostData>();
  @Output() exportComplete = new EventEmitter<string>();

  private destroy$ = new Subject<void>();
  private chartData: any[] = [];
  private legendItems: any[] = [];
  
  isLoading = false;
  canvasWidth = 800;
  canvasHeight = 400;
  
  analysis: CostAnalysis | null = null;

  constructor() {}

  ngOnInit(): void {
    this.canvasWidth = this.width;
    this.canvasHeight = this.height;
    
    if (this.data && this.data.length > 0) {
      this.processData();
      this.calculateAnalysis();
      this.drawChart();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(): void {
    if (this.data && this.data.length > 0) {
      this.processData();
      this.calculateAnalysis();
      this.drawChart();
    }
  }

  private processData(): void {
    if (!this.data || this.data.length === 0) {
      this.chartData = [];
      return;
    }

    // Group data based on selected grouping
    let groupedData: any;
    
    switch (this.groupBy) {
      case 'category':
        groupedData = this.groupByCategory(this.data);
        break;
      case 'car':
        groupedData = this.groupByCar(this.data);
        break;
      default:
        groupedData = this.groupByMonth(this.data);
    }

    this.chartData = groupedData;
  }

  private groupByMonth(data: MaintenanceCostData[]): any {
    const monthlyTotals = data.reduce((acc, item) => {
      const month = new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      acc[month] = (acc[month] || 0) + item.cost;
      return acc;
    }, {} as Record<string, number>);

    const sortedEntries = Object.entries(monthlyTotals)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

    this.legendItems = sortedEntries.map(([label], index) => ({
      label,
      color: this.getColor(index)
    }));

    return sortedEntries.map(([label, value]) => ({ label, value }));
  }

  private groupByCategory(data: MaintenanceCostData[]): any {
    const categoryTotals = data.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.cost;
      return acc;
    }, {} as Record<string, number>);

    const sortedEntries = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1]);

    this.legendItems = sortedEntries.map(([label], index) => ({
      label,
      color: this.getColor(index)
    }));

    return sortedEntries.map(([label, value]) => ({ label, value }));
  }

  private groupByCar(data: MaintenanceCostData[]): any {
    const carTotals = data.reduce((acc, item) => {
      const carName = item.carName || `Car ${item.carId}`;
      acc[carName] = (acc[carName] || 0) + item.cost;
      return acc;
    }, {} as Record<string, number>);

    const sortedEntries = Object.entries(carTotals)
      .sort((a, b) => b[1] - a[1]);

    this.legendItems = sortedEntries.map(([label], index) => ({
      label,
      color: this.getColor(index)
    }));

    return sortedEntries.map(([label, value]) => ({ label, value }));
  }

  private getColor(index: number): string {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ];
    return colors[index % colors.length];
  }

  private calculateAnalysis(): void {
    if (!this.data || this.data.length === 0) {
      this.analysis = null;
      return;
    }

    const totalCost = this.data.reduce((sum, item) => sum + item.cost, 0);
    const averageCost = totalCost / this.data.length;

    // Calculate trend
    const sortedData = [...this.data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
    const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.cost, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.cost, 0) / secondHalf.length;
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    const threshold = 0.1; // 10% threshold
    
    if (secondHalfAvg > firstHalfAvg * (1 + threshold)) {
      trend = 'increasing';
    } else if (secondHalfAvg < firstHalfAvg * (1 - threshold)) {
      trend = 'decreasing';
    }

    // Most expensive category
    const categoryTotals = this.data.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.cost;
      return acc;
    }, {} as Record<string, number>);

    const mostExpensiveCategory = Object.keys(categoryTotals).reduce((a, b) => 
      categoryTotals[a] > categoryTotals[b] ? a : b, ''
    );

    // Cost by category
    const costByCategory = Object.entries(categoryTotals).map(([category, cost]) => ({
      category,
      cost
    })).sort((a, b) => b.cost - a.cost);

    // Cost by month
    const monthlyTotals = this.data.reduce((acc, item) => {
      const month = new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      acc[month] = (acc[month] || 0) + item.cost;
      return acc;
    }, {} as Record<string, number>);

    const costByMonth = Object.entries(monthlyTotals).map(([month, cost]) => ({
      month,
      cost
    })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    this.analysis = {
      totalCost,
      averageCost,
      trend,
      mostExpensiveCategory,
      costByCategory,
      costByMonth
    };
  }

  private drawChart(): void {
    if (!this.chartCanvas || !this.chartData.length) return;

    const canvas = this.chartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas dimensions
    const padding = 60;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;

    // Draw based on chart type
    switch (this.chartType) {
      case 'line':
        this.drawLineChart(ctx, padding, chartWidth, chartHeight);
        break;
      case 'bar':
        this.drawBarChart(ctx, padding, chartWidth, chartHeight);
        break;
      case 'pie':
        this.drawPieChart(ctx, padding, chartWidth, chartHeight);
        break;
    }

    // Draw axes for line and bar charts
    if (this.chartType !== 'pie') {
      this.drawAxes(ctx, padding, chartWidth, chartHeight);
    }
  }

  private drawAxes(ctx: CanvasRenderingContext2D, padding: number, chartWidth: number, chartHeight: number): void {
    const isDark = document.documentElement.classList.contains('dark');
    ctx.strokeStyle = isDark ? '#374151' : '#E5E7EB';
    ctx.fillStyle = isDark ? '#D1D5DB' : '#374151';
    ctx.lineWidth = 1;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.stroke();

    // Draw labels
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';

    // X-axis labels
    const maxLabels = Math.min(this.chartData.length, 8);
    const step = Math.max(1, Math.floor(this.chartData.length / maxLabels));
    
    this.chartData.forEach((item, index) => {
      if (index % step === 0) {
        const x = padding + (index * chartWidth) / (this.chartData.length - 1);
        ctx.fillText(item.label, x, canvas.height - padding + 20);
      }
    });

    // Y-axis labels
    const maxValue = Math.max(...this.chartData.map(d => d.value));
    const ySteps = 5;
    
    for (let i = 0; i <= ySteps; i++) {
      const value = (maxValue * i) / ySteps;
      const y = canvas.height - padding - (value / maxValue) * chartHeight;
      
      ctx.fillText(this.formatCurrency(value), padding - 10, y + 4);
      
      // Grid lines
      ctx.strokeStyle = 'rgba(229, 231, 235, 0.3)';
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }
  }

  private drawLineChart(ctx: CanvasRenderingContext2D, padding: number, chartWidth: number, chartHeight: number): void {
    if (this.chartData.length < 2) return;

    const isDark = document.documentElement.classList.contains('dark');
    const color = this.getColor(0);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const maxValue = Math.max(...this.chartData.map(d => d.value));

    // Draw line
    this.chartData.forEach((item, index) => {
      const x = padding + (index * chartWidth) / (this.chartData.length - 1);
      const y = canvas.height - padding - (item.value / maxValue) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      // Draw points
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    ctx.stroke();
  }

  private drawBarChart(ctx: CanvasRenderingContext2D, padding: number, chartWidth: number, chartHeight: number): void {
    const barWidth = chartWidth / this.chartData.length * 0.8;
    const maxValue = Math.max(...this.chartData.map(d => d.value));

    this.chartData.forEach((item, index) => {
      const x = padding + (index * chartWidth) / this.chartData.length + (chartWidth / this.chartData.length - barWidth) / 2;
      const barHeight = (item.value / maxValue) * chartHeight;
      const y = canvas.height - padding - barHeight;

      // Draw bar
      ctx.fillStyle = this.getColor(index);
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw value on top of bar
      ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#F3F4F6' : '#1F2937';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.formatCurrency(item.value), x + barWidth / 2, y - 5);
    });
  }

  private drawPieChart(ctx: CanvasRenderingContext2D, padding: number, chartWidth: number, chartHeight: number): void {
    const total = this.chartData.reduce((sum, item) => sum + item.value, 0);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(chartWidth, chartHeight) / 2 - 20;

    let currentAngle = -Math.PI / 2;

    this.chartData.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;

      // Draw slice
      ctx.fillStyle = this.getColor(index);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Draw border
      ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#374151' : '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw percentage label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * radius * 0.7;
      const labelY = centerY + Math.sin(labelAngle) * radius * 0.7;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(item.value / total * 100)}%`, labelX, labelY);

      currentAngle += sliceAngle;
    });
  }

  onCanvasClick(event: MouseEvent): void {
    if (this.chartType === 'pie') {
      const rect = this.chartCanvas.nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Simple hit detection for pie chart
      const centerX = this.canvasWidth / 2;
      const centerY = this.canvasHeight / 2;
      const radius = Math.min(this.canvasWidth, this.canvasHeight) / 2 - 20;
      
      const distanceFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      
      if (distanceFromCenter <= radius) {
        const angle = Math.atan2(y - centerY, x - centerX);
        const normalizedAngle = angle < -Math.PI / 2 ? angle + 2 * Math.PI : angle;
        
        const total = this.chartData.reduce((sum, item) => sum + item.value, 0);
        let currentAngle = -Math.PI / 2;
        
        for (let i = 0; i < this.chartData.length; i++) {
          const sliceAngle = (this.chartData[i].value / total) * 2 * Math.PI;
          
          if (normalizedAngle >= currentAngle && normalizedAngle <= currentAngle + sliceAngle) {
            // Emit click event with corresponding data
            this.dataPointClick.emit(this.data[i]);
            break;
          }
          
          currentAngle += sliceAngle;
        }
      }
    }
  }

  // ========== PUBLIC METHODS ==========

  changeChartType(type: 'line' | 'bar' | 'pie'): void {
    this.chartType = type;
    this.drawChart();
  }

  exportChart(): void {
    try {
      const canvas = this.chartCanvas.nativeElement;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `maintenance-cost-chart-${new Date().toISOString().split('T')[0]}.png`;
      link.href = url;
      link.click();

      this.exportComplete.emit('Chart exported successfully');
    } catch (error) {
      console.error('Failed to export chart:', error);
      this.exportComplete.emit('Failed to export chart');
    }
  }

  updateData(newData: MaintenanceCostData[]): void {
    this.data = newData;
    this.processData();
    this.calculateAnalysis();
    this.drawChart();
  }

  refreshChart(): void {
    this.drawChart();
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
}