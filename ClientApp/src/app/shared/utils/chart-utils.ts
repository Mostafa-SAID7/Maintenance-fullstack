/**
 * Chart utility functions for the Car Maintenance System
 * Provides common chart configurations, color schemes, and data transformation utilities
 */

/**
 * Chart color schemes for consistent theming
 */
export class ChartColorSchemes {
  static readonly primary = {
    primary: '#3B82F6',
    primaryLight: '#93C5FD',
    primaryDark: '#1D4ED8'
  };

  static readonly success = {
    success: '#10B981',
    successLight: '#6EE7B7',
    successDark: '#047857'
  };

  static readonly warning = {
    warning: '#F59E0B',
    warningLight: '#FCD34D',
    warningDark: '#D97706'
  };

  static readonly danger = {
    danger: '#EF4444',
    dangerLight: '#FCA5A5',
    dangerDark: '#DC2626'
  };

  static readonly maintenance = {
    oilChange: '#3B82F6',
    brakeService: '#EF4444',
    tireService: '#6B7280',
    engineRepair: '#F59E0B',
    transmission: '#8B5CF6',
    battery: '#10B981',
    cooling: '#06B6D4',
    exhaust: '#84CC16'
  };

  static readonly neutral = {
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827'
  };

  static readonly gradient = {
    blueGradient: ['#3B82F6', '#1D4ED8', '#1E40AF'],
    greenGradient: ['#10B981', '#047857', '#065F46'],
    redGradient: ['#EF4444', '#DC2626', '#B91C1C'],
    yellowGradient: ['#F59E0B', '#D97706', '#B45309']
  };
}

/**
 * Common chart configuration options
 */
export class ChartConfiguration {
  /**
   * Default chart options for responsive design
   */
  static getResponsiveOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 20
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#3B82F6',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: {
            display: true,
            color: '#E5E7EB'
          },
          ticks: {
            color: '#6B7280'
          }
        },
        y: {
          grid: {
            display: true,
            color: '#E5E7EB'
          },
          ticks: {
            color: '#6B7280'
          }
        }
      }
    };
  }

  /**
   * Maintenance cost chart specific options
   */
  static getMaintenanceCostOptions(): any {
    return {
      ...this.getResponsiveOptions(),
      plugins: {
        ...this.getResponsiveOptions().plugins,
        title: {
          display: true,
          text: 'Maintenance Cost Over Time',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              return `Cost: $${context.parsed.y.toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        ...this.getResponsiveOptions().scales,
        y: {
          ...this.getResponsiveOptions().scales.y,
          beginAtZero: true,
          ticks: {
            ...this.getResponsiveOptions().scales.y.ticks,
            callback: function(value: any) {
              return '$' + value.toLocaleString();
            }
          }
        }
      }
    };
  }

  /**
   * Mileage chart specific options
   */
  static getMileageChartOptions(): any {
    return {
      ...this.getResponsiveOptions(),
      plugins: {
        ...this.getResponsiveOptions().plugins,
        title: {
          display: true,
          text: 'Mileage Tracking',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              return `Mileage: ${context.parsed.y.toLocaleString()} miles`;
            }
          }
        }
      },
      scales: {
        ...this.getResponsiveOptions().scales,
        y: {
          ...this.getResponsiveOptions().scales.y,
          beginAtZero: false,
          ticks: {
            ...this.getResponsiveOptions().scales.y.ticks,
            callback: function(value: any) {
              return value.toLocaleString() + ' mi';
            }
          }
        }
      }
    };
  }

  /**
   * Service type distribution pie chart options
   */
  static getServiceTypeDistributionOptions(): any {
    return {
      ...this.getResponsiveOptions(),
      plugins: {
        ...this.getResponsiveOptions().plugins,
        title: {
          display: true,
          text: 'Service Type Distribution',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    };
  }

  /**
   * Predictive analytics chart options
   */
  static getPredictiveAnalyticsOptions(): any {
    return {
      ...this.getResponsiveOptions(),
      plugins: {
        ...this.getResponsiveOptions().plugins,
        title: {
          display: true,
          text: 'Predictive Maintenance Analytics',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context: any) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              if (label.includes('Confidence')) {
                return `${label}: ${value}%`;
              } else if (label.includes('Cost')) {
                return `${label}: $${value.toLocaleString()}`;
              } else {
                return `${label}: ${value}`;
              }
            }
          }
        }
      },
      scales: {
        ...this.getResponsiveOptions().scales,
        y: {
          ...this.getResponsiveOptions().scales.y,
          beginAtZero: true
        }
      }
    };
  }
}

/**
 * Data transformation utilities for charts
 */
export class ChartDataTransformers {
  /**
   * Transform maintenance cost data for line chart
   */
  static transformMaintenanceCostData(records: any[]): any {
    const sortedRecords = records.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      labels: sortedRecords.map(record => 
        new Date(record.date).toLocaleDateString()
      ),
      datasets: [{
        label: 'Total Cost',
        data: sortedRecords.map(record => record.totalCost),
        borderColor: ChartColorSchemes.primary.primary,
        backgroundColor: ChartColorSchemes.primary.primaryLight + '20',
        fill: true,
        tension: 0.4
      }]
    };
  }

  /**
   * Transform mileage data for line chart
   */
  static transformMileageData(records: any[]): any {
    const sortedRecords = records.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      labels: sortedRecords.map(record => 
        new Date(record.date).toLocaleDateString()
      ),
      datasets: [{
        label: 'Mileage',
        data: sortedRecords.map(record => record.mileage),
        borderColor: ChartColorSchemes.success.success,
        backgroundColor: ChartColorSchemes.success.successLight + '20',
        fill: false,
        tension: 0.1
      }]
    };
  }

  /**
   * Transform service type data for pie chart
   */
  static transformServiceTypeData(records: any[]): any {
    const serviceTypeCounts = records.reduce((acc, record) => {
      acc[record.serviceType] = (acc[record.serviceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(serviceTypeCounts);
    const data = Object.values(serviceTypeCounts);
    
    const colors = [
      ChartColorSchemes.maintenance.oilChange,
      ChartColorSchemes.maintenance.brakeService,
      ChartColorSchemes.maintenance.tireService,
      ChartColorSchemes.maintenance.engineRepair,
      ChartColorSchemes.maintenance.transmission,
      ChartColorSchemes.maintenance.battery,
      ChartColorSchemes.maintenance.cooling,
      ChartColorSchemes.maintenance.exhaust
    ];

    return {
      labels: labels.map(label => this.formatServiceTypeLabel(label)),
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: colors.slice(0, labels.length).map(color => this.lightenColor(color, 0.2)),
        borderWidth: 2
      }]
    };
  }

  /**
   * Transform cost analysis data for bar chart
   */
  static transformCostAnalysisData(cars: any[]): any {
    return {
      labels: cars.map(car => `${car.year} ${car.make} ${car.model}`),
      datasets: [{
        label: 'Total Maintenance Cost',
        data: cars.map(car => car.totalCost),
        backgroundColor: ChartColorSchemes.primary.primary + '80',
        borderColor: ChartColorSchemes.primary.primary,
        borderWidth: 1
      }]
    };
  }

  /**
   * Transform predictive analytics data for multi-line chart
   */
  static transformPredictiveAnalyticsData(predictions: any[]): any {
    const sortedPredictions = predictions.sort((a, b) => 
      new Date(a.predictedDate).getTime() - new Date(b.predictedDate).getTime()
    );

    return {
      labels: sortedPredictions.map(prediction => 
        new Date(prediction.predictedDate).toLocaleDateString()
      ),
      datasets: [
        {
          label: 'Predicted Cost',
          data: sortedPredictions.map(prediction => prediction.predictedCost),
          borderColor: ChartColorSchemes.warning.warning,
          backgroundColor: ChartColorSchemes.warning.warningLight + '20',
          fill: false,
          tension: 0.4
        },
        {
          label: 'Confidence Level',
          data: sortedPredictions.map(prediction => prediction.confidence),
          borderColor: ChartColorSchemes.danger.danger,
          backgroundColor: ChartColorSchemes.danger.dangerLight + '20',
          fill: false,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
  }

  /**
   * Helper method to format service type labels
   */
  private static formatServiceTypeLabel(serviceType: string): string {
    return serviceType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Helper method to lighten a hex color
   */
  private static lightenColor(color: string, factor: number): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const newR = Math.min(255, Math.round(r + (255 - r) * factor));
    const newG = Math.min(255, Math.round(g + (255 - g) * factor));
    const newB = Math.min(255, Math.round(b + (255 - b) * factor));
    
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
}

/**
 * Chart export utilities
 */
export class ChartExportUtils {
  /**
   * Export chart data as CSV
   */
  static exportToCSV(data: any[], filename: string): void {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' && row[header].includes(',') 
            ? `"${row[header]}"` 
            : row[header]
        ).join(',')
      )
    ].join('\n');

    this.downloadCSV(csvContent, filename);
  }

  /**
   * Generate chart image as base64
   */
  static async generateChartImage(chart: any): Promise<string> {
    return new Promise((resolve) => {
      chart.toBase64Image((imageUrl: string) => {
        resolve(imageUrl);
      });
    });
  }

  /**
   * Download CSV file
   */
  private static downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

/**
 * Chart animation utilities
 */
export class ChartAnimations {
  /**
   * Get animation configuration for chart entrance
   */
  static getEntranceAnimation(): any {
    return {
      duration: 1000,
      easing: 'easeInOutQuart',
      delay: function(context: any) {
        return context.type === 'data' && context.mode === 'default' ? context.dataIndex * 100 : 0;
      }
    };
  }

  /**
   * Get animation configuration for chart updates
   */
  static getUpdateAnimation(): any {
    return {
      duration: 500,
      easing: 'easeInOutCubic',
      onComplete: function() {
        // Animation complete callback
      }
    };
  }
}

/**
 * Chart accessibility utilities
 */
export class ChartAccessibility {
  /**
   * Generate alt text for chart
   */
  static generateAltText(chartType: string, data: any, title?: string): string {
    const baseText = `Chart showing ${chartType} data`;
    const dataDescription = this.describeData(data);
    const fullTitle = title ? `${title}. ` : '';
    
    return `${fullTitle}${baseText}. ${dataDescription}`;
  }

  /**
   * Describe chart data in text format
   */
  private static describeData(data: any): string {
    if (data.labels && data.datasets) {
      const datasetCount = data.datasets.length;
      const labelCount = data.labels.length;
      
      if (datasetCount === 1 && data.datasets[0].label) {
        const label = data.datasets[0].label;
        return `Contains ${labelCount} data points for ${label.toLowerCase()}.`;
      } else {
        return `Contains ${labelCount} data points across ${datasetCount} datasets.`;
      }
    }
    
    return 'Chart data is available for analysis.';
  }
}