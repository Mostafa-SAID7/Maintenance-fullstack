import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface PredictionData {
  date: string;
  predictedCost: number;
  confidence: number;
  category: string;
  carId?: string;
  carName?: string;
}

export interface PredictionAnalysis {
  totalPredictedCost: number;
  averageConfidence: number;
  predictionsByCategory: { category: string; cost: number }[];
  predictionsByMonth: { month: string; cost: number }[];
  accuracy: number;
}

@Component({
  selector: 'app-prediction-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="prediction-chart bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <!-- Chart Header -->
      <div class="flex justify-between items-center mb-6">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Predictive Analytics</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">AI-powered maintenance cost predictions</p>
        </div>
        <div class="flex space-x-2">
          <!-- Time Range Toggle -->
          <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              type="button"
              (click)="changeTimeRange('3months')"
              class="px-3 py-1 text-sm rounded-md transition-colors"
              [ngClass]="{
                'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow': timeRange === '3months',
                'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white': timeRange !== '3months'
              }"
            >
              3 Months
            </button>
            <button
              type="button"
              (click)="changeTimeRange('6months')"
              class="px-3 py-1 text-sm rounded-md transition-colors"
              [ngClass]="{
                'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow': timeRange === '6months',
                'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white': timeRange !== '6months'
              }"
            >
              6 Months
            </button>
            <button
              type="button"
              (click)="changeTimeRange('12months')"
              class="px-3 py-1 text-sm rounded-md transition-colors"
              [ngClass]="{
                'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow': timeRange === '12months',
                'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white': timeRange !== '12months'
              }"
            >
              12 Months
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

      <!-- Prediction Summary Cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-6" *ngIf="analysis">
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Predicted Cost</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ analysis.totalPredictedCost | currency }}</p>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Confidence</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ analysis.averageConfidence | number:'1.0-0' }}%</p>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Accuracy</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ analysis.accuracy | number:'1.0-0' }}%</p>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-6 w-6 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Time Range</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ timeRange.replace(/(\d+)months/, '$1 Mo') }}</p>
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
            <span class="text-gray-600 dark:text-gray-400">Analyzing predictions...</span>
          </div>
        </div>
      </div>

      <!-- Chart Legend -->
      <div class="mt-4 flex flex-wrap justify-center gap-4" *ngIf="legendItems.length > 0">
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
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No prediction data</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">AI predictions will appear once enough historical data is available.</p>
      </div>
    </div>
  `,
  styles: [`
    .prediction-chart {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    canvas {
      display: block;
    }
  `]
})
export class PredictionChartComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  @Input() data: PredictionData[] = [];
  @Input() timeRange: '3months' | '6months' | '12months' = '6months';
  @Input() height = 400;
  @Input() width = 800;
  @Input() title = 'Predictive Analytics';
  @Input() showExport = true;
  
  @Output() dataPointClick = new EventEmitter<PredictionData>();
  @Output() exportComplete = new EventEmitter<string>();

  private destroy$ = new Subject<void>();
  chartData: any[] = [];
  legendItems: any[] = [];
  
  isLoading = false;
  canvasWidth = 800;
  canvasHeight = 400;
  
  analysis: PredictionAnalysis | null = null;

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

    // Filter data by time range
    const filteredData = this.filterByTimeRange(this.data);
    
    // Group data by month
    const monthlyPredictions = filteredData.reduce((acc, item) => {
      const month = new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      acc[month] = (acc[month] || 0) + item.predictedCost;
      return acc;
    }, {} as Record<string, number>);

    const sortedEntries = Object.entries(monthlyPredictions)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

    this.legendItems = sortedEntries.map(([label], index) => ({
      label,
      color: this.getColor(index)
    }));

    this.chartData = sortedEntries.map(([label, value]) => ({ label, value }));
  }

  private filterByTimeRange(data: PredictionData[]): PredictionData[] {
    const now = new Date();
    const monthsBack = this.timeRange === '3months' ? 3 : this.timeRange === '6months' ? 6 : 12;
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate());
    
    return data.filter(item => new Date(item.date) >= cutoffDate);
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

    const filteredData = this.filterByTimeRange(this.data);
    
    const totalPredictedCost = filteredData.reduce((sum, item) => sum + item.predictedCost, 0);
    const averageConfidence = filteredData.reduce((sum, item) => sum + item.confidence, 0) / filteredData.length;

    // Calculate predictions by category
    const categoryTotals = filteredData.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.predictedCost;
      return acc;
    }, {} as Record<string, number>);

    const predictionsByCategory = Object.entries(categoryTotals).map(([category, cost]) => ({
      category,
      cost
    })).sort((a, b) => b.cost - a.cost);

    // Calculate predictions by month
    const monthlyTotals = filteredData.reduce((acc, item) => {
      const month = new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      acc[month] = (acc[month] || 0) + item.predictedCost;
      return acc;
    }, {} as Record<string, number>);

    const predictionsByMonth = Object.entries(monthlyTotals).map(([month, cost]) => ({
      month,
      cost
    })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Calculate accuracy (mock calculation for demo)
    const accuracy = Math.random() * 20 + 80; // Random accuracy between 80-100%

    this.analysis = {
      totalPredictedCost,
      averageConfidence,
      predictionsByCategory,
      predictionsByMonth,
      accuracy
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

    // Draw line chart with confidence intervals
    this.drawLineChart(ctx, padding, chartWidth, chartHeight);
    this.drawAxes(ctx, padding, chartWidth, chartHeight);
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
    const maxValue = Math.max(...this.chartData.map(d => d.value));
    
    // Draw confidence interval (area)
    ctx.fillStyle = this.hexToRgba(color, 0.2);
    ctx.beginPath();
    
    this.chartData.forEach((item, index) => {
      const x = padding + (index * chartWidth) / (this.chartData.length - 1);
      const y = canvas.height - padding - (item.value / maxValue) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    // Close the path for area fill
    const lastX = padding + ((this.chartData.length - 1) * chartWidth) / (this.chartData.length - 1);
    ctx.lineTo(lastX, canvas.height - padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw main line
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();

    this.chartData.forEach((item, index) => {
      const x = padding + (index * chartWidth) / (this.chartData.length - 1);
      const y = canvas.height - padding - (item.value / maxValue) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw data points
    this.chartData.forEach((item, index) => {
      const x = padding + (index * chartWidth) / (this.chartData.length - 1);
      const y = canvas.height - padding - (item.value / maxValue) * chartHeight;

      // Draw point
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Draw confidence indicator
      const confidence = this.data[index]?.confidence || 0;
      const radius = 8;
      ctx.strokeStyle = this.getConfidenceColor(confidence);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    });
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private getConfidenceColor(confidence: number): string {
    if (confidence >= 80) return '#10B981'; // Green
    if (confidence >= 60) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  }

  onCanvasClick(event: MouseEvent): void {
    const rect = this.chartCanvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Simple hit detection for line chart
    const padding = 60;
    const chartWidth = canvas.width - 2 * padding;
    const maxValue = Math.max(...this.chartData.map(d => d.value));
    
    for (let i = 0; i < this.chartData.length; i++) {
      const pointX = padding + (i * chartWidth) / (this.chartData.length - 1);
      const pointY = canvas.height - padding - (this.chartData[i].value / maxValue) * (canvas.height - 2 * padding);
      
      const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));
      
      if (distance <= 10) { // Click radius
        this.dataPointClick.emit(this.data[i]);
        break;
      }
    }
  }

  // ========== PUBLIC METHODS ==========

  changeTimeRange(range: '3months' | '6months' | '12months'): void {
    this.timeRange = range;
    this.processData();
    this.calculateAnalysis();
    this.drawChart();
  }

  exportChart(): void {
    try {
      const canvas = this.chartCanvas.nativeElement;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `prediction-chart-${new Date().toISOString().split('T')[0]}.png`;
      link.href = url;
      link.click();

      this.exportComplete.emit('Chart exported successfully');
    } catch (error) {
      console.error('Failed to export chart:', error);
      this.exportComplete.emit('Failed to export chart');
    }
  }

  updateData(newData: PredictionData[]): void {
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