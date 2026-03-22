/**
 * TickShark Configuration Manager Service
 * Handles configuration management, validation, and persistence
 */

import { 
  TickSharkConfig, 
  ConfigPreset, 
  ConfigValidationResult, 
  ConfigValidationError,
  ConfigValidationWarning,
  ConfigExport,
  DEFAULT_CONFIG,
  CONFIG_PRESETS 
} from '../../types/tickshark/config.types';

class ConfigManagerService {
  private config: TickSharkConfig = { ...DEFAULT_CONFIG };
  private listeners: ((config: TickSharkConfig) => void)[] = [];
  private storageKey = 'tickshark_config';
  private validationRules: Map<string, (value: any) => ConfigValidationError | null> = new Map();

  constructor() {
    this.initializeValidationRules();
    this.loadConfig();
  }

  /**
   * Initialize configuration validation rules
   */
  private initializeValidationRules(): void {
    // Analysis validation rules
    this.validationRules.set('analysis.tickBufferSize', (value: number) => {
      if (value < 10 || value > 1000) {
        return {
          field: 'analysis.tickBufferSize',
          message: 'Tick buffer size must be between 10 and 1000',
          severity: 'ERROR'
        };
      }
      return null;
    });

    this.validationRules.set('analysis.analysisInterval', (value: number) => {
      if (value < 500 || value > 30000) {
        return {
          field: 'analysis.analysisInterval',
          message: 'Analysis interval must be between 500ms and 30000ms',
          severity: 'ERROR'
        };
      }
      return null;
    });

    this.validationRules.set('analysis.latencyThreshold', (value: number) => {
      if (value < 10 || value > 1000) {
        return {
          field: 'analysis.latencyThreshold',
          message: 'Latency threshold must be between 10ms and 1000ms',
          severity: 'ERROR'
        };
      }
      return null;
    });

    this.validationRules.set('analysis.minConfidence', (value: number) => {
      if (value < 0 || value > 100) {
        return {
          field: 'analysis.minConfidence',
          message: 'Minimum confidence must be between 0 and 100',
          severity: 'ERROR'
        };
      }
      return null;
    });

    // Signal validation rules
    this.validationRules.set('signals.minConfidence', (value: number) => {
      if (value < 0 || value > 100) {
        return {
          field: 'signals.minConfidence',
          message: 'Signal minimum confidence must be between 0 and 100',
          severity: 'ERROR'
        };
      }
      return null;
    });

    this.validationRules.set('signals.maxRisk', (value: number) => {
      if (value < 0 || value > 100) {
        return {
          field: 'signals.maxRisk',
          message: 'Maximum risk must be between 0 and 100',
          severity: 'ERROR'
        };
      }
      return null;
    });

    this.validationRules.set('signals.maxSignalsPerMinute', (value: number) => {
      if (value < 1 || value > 60) {
        return {
          field: 'signals.maxSignalsPerMinute',
          message: 'Max signals per minute must be between 1 and 60',
          severity: 'ERROR'
        };
      }
      return null;
    });

    // Risk validation rules
    this.validationRules.set('risk.maxStake', (value: number) => {
      if (value < 0.35 || value > 1000) {
        return {
          field: 'risk.maxStake',
          message: 'Maximum stake must be between 0.35 and 1000',
          severity: 'ERROR'
        };
      }
      return null;
    });

    this.validationRules.set('risk.minStake', (value: number) => {
      if (value < 0.35 || value > 100) {
        return {
          field: 'risk.minStake',
          message: 'Minimum stake must be between 0.35 and 100',
          severity: 'ERROR'
        };
      }
      return null;
    });

    this.validationRules.set('risk.maxDailyLoss', (value: number) => {
      if (value < 1 || value > 10000) {
        return {
          field: 'risk.maxDailyLoss',
          message: 'Maximum daily loss must be between 1 and 10000',
          severity: 'ERROR'
        };
      }
      return null;
    });

    this.validationRules.set('risk.maxConcurrentTrades', (value: number) => {
      if (value < 1 || value > 20) {
        return {
          field: 'risk.maxConcurrentTrades',
          message: 'Maximum concurrent trades must be between 1 and 20',
          severity: 'ERROR'
        };
      }
      return null;
    });

    // Performance validation rules
    this.validationRules.set('performance.cacheSize', (value: number) => {
      if (value < 10 || value > 500) {
        return {
          field: 'performance.cacheSize',
          message: 'Cache size must be between 10MB and 500MB',
          severity: 'ERROR'
        };
      }
      return null;
    });

    this.validationRules.set('performance.maxWorkerThreads', (value: number) => {
      if (value < 1 || value > 16) {
        return {
          field: 'performance.maxWorkerThreads',
          message: 'Max worker threads must be between 1 and 16',
          severity: 'ERROR'
        };
      }
      return null;
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): TickSharkConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  async updateConfig(updates: Partial<TickSharkConfig>): Promise<ConfigValidationResult> {
    const newConfig = this.mergeConfig(this.config, updates);
    const validation = this.validateConfig(newConfig);

    if (validation.isValid) {
      this.config = newConfig;
      this.config.lastModified = Date.now();
      await this.saveConfig();
      this.notifyListeners();
    }

    return validation;
  }

  /**
   * Reset configuration to defaults
   */
  async resetToDefaults(): Promise<void> {
    this.config = { ...DEFAULT_CONFIG };
    this.config.lastModified = Date.now();
    await this.saveConfig();
    this.notifyListeners();
  }

  /**
   * Apply configuration preset
   */
  async applyPreset(presetId: string): Promise<ConfigValidationResult> {
    const preset = CONFIG_PRESETS.find(p => p.id === presetId);
    if (!preset) {
      return {
        isValid: false,
        errors: [{
          field: 'preset',
          message: `Preset '${presetId}' not found`,
          severity: 'ERROR'
        }],
        warnings: []
      };
    }

    return this.updateConfig(preset.config);
  }

  /**
   * Get available presets
   */
  getPresets(): ConfigPreset[] {
    return [...CONFIG_PRESETS];
  }

  /**
   * Validate configuration
   */
  validateConfig(config: TickSharkConfig): ConfigValidationResult {
    const errors: ConfigValidationError[] = [];
    const warnings: ConfigValidationWarning[] = [];

    // Validate each field using validation rules
    this.validateObject(config, '', errors);

    // Cross-field validation
    this.performCrossFieldValidation(config, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate object recursively
   */
  private validateObject(obj: any, prefix: string, errors: ConfigValidationError[]): void {
    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.validateObject(value, fieldPath, errors);
      } else {
        const rule = this.validationRules.get(fieldPath);
        if (rule) {
          const error = rule(value);
          if (error) {
            errors.push(error);
          }
        }
      }
    }
  }

  /**
   * Perform cross-field validation
   */
  private performCrossFieldValidation(
    config: TickSharkConfig, 
    errors: ConfigValidationError[], 
    warnings: ConfigValidationWarning[]
  ): void {
    // Validate min/max stake relationship
    if (config.risk.minStake >= config.risk.maxStake) {
      errors.push({
        field: 'risk.minStake',
        message: 'Minimum stake must be less than maximum stake',
        severity: 'ERROR'
      });
    }

    // Validate confidence thresholds
    if (config.signals.minConfidence < config.analysis.minConfidence) {
      warnings.push({
        field: 'signals.minConfidence',
        message: 'Signal confidence is lower than analysis confidence',
        recommendation: 'Consider increasing signal confidence threshold'
      });
    }

    // Validate latency weights
    const totalWeight = config.analysis.networkLatencyWeight + config.analysis.processingLatencyWeight;
    if (Math.abs(totalWeight - 1.0) > 0.01) {
      errors.push({
        field: 'analysis.networkLatencyWeight',
        message: 'Network and processing latency weights must sum to 1.0',
        severity: 'ERROR'
      });
    }

    // Performance warnings
    if (config.performance.maxWorkerThreads > navigator.hardwareConcurrency) {
      warnings.push({
        field: 'performance.maxWorkerThreads',
        message: `System has ${navigator.hardwareConcurrency} cores, but ${config.performance.maxWorkerThreads} worker threads configured`,
        recommendation: `Consider reducing to ${navigator.hardwareConcurrency} or fewer`
      });
    }

    // Risk warnings
    if (config.risk.riskToleranceLevel === 'HIGH' && config.risk.maxStake > 50) {
      warnings.push({
        field: 'risk.maxStake',
        message: 'High risk tolerance with large maximum stake',
        recommendation: 'Consider reducing maximum stake for better risk management'
      });
    }
  }

  /**
   * Export configuration
   */
  exportConfig(): ConfigExport {
    const exportData: ConfigExport = {
      config: { ...this.config },
      metadata: {
        exportDate: Date.now(),
        version: this.config.version,
        platform: 'TickShark',
        checksum: this.generateChecksum(this.config)
      }
    };

    return exportData;
  }

  /**
   * Import configuration
   */
  async importConfig(exportData: ConfigExport): Promise<ConfigValidationResult> {
    try {
      // Validate checksum
      const expectedChecksum = this.generateChecksum(exportData.config);
      if (exportData.metadata.checksum !== expectedChecksum) {
        return {
          isValid: false,
          errors: [{
            field: 'import',
            message: 'Configuration checksum validation failed',
            severity: 'ERROR'
          }],
          warnings: []
        };
      }

      // Validate configuration
      const validation = this.validateConfig(exportData.config);
      if (validation.isValid) {
        this.config = { ...exportData.config };
        this.config.lastModified = Date.now();
        await this.saveConfig();
        this.notifyListeners();
      }

      return validation;
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'import',
          message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'ERROR'
        }],
        warnings: []
      };
    }
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(listener: (config: TickSharkConfig) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Load configuration from storage
   */
  private async loadConfig(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        const validation = this.validateConfig(parsedConfig);
        
        if (validation.isValid) {
          this.config = parsedConfig;
        } else {
          console.warn('Invalid stored configuration, using defaults:', validation.errors);
          this.config = { ...DEFAULT_CONFIG };
        }
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  /**
   * Save configuration to storage
   */
  private async saveConfig(): Promise<void> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }

  /**
   * Merge configuration objects
   */
  private mergeConfig(base: TickSharkConfig, updates: Partial<TickSharkConfig>): TickSharkConfig {
    const merged = { ...base };

    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        merged[key as keyof TickSharkConfig] = {
          ...merged[key as keyof TickSharkConfig],
          ...value
        } as any;
      } else {
        merged[key as keyof TickSharkConfig] = value as any;
      }
    }

    return merged;
  }

  /**
   * Generate configuration checksum
   */
  private generateChecksum(config: TickSharkConfig): string {
    const configString = JSON.stringify(config, Object.keys(config).sort());
    let hash = 0;
    for (let i = 0; i < configString.length; i++) {
      const char = configString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Notify configuration change listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.config);
      } catch (error) {
        console.error('Configuration listener error:', error);
      }
    });
  }

  /**
   * Get configuration field value by path
   */
  getConfigValue(path: string): any {
    const keys = path.split('.');
    let value: any = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Set configuration field value by path
   */
  async setConfigValue(path: string, value: any): Promise<ConfigValidationResult> {
    const keys = path.split('.');
    const updates: any = {};
    let current = updates;

    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    
    return this.updateConfig(updates);
  }

  /**
   * Get configuration summary for display
   */
  getConfigSummary(): {
    analysisSettings: number;
    signalSettings: number;
    riskSettings: number;
    performanceSettings: number;
    totalSettings: number;
  } {
    return {
      analysisSettings: Object.keys(this.config.analysis).length,
      signalSettings: Object.keys(this.config.signals).length,
      riskSettings: Object.keys(this.config.risk).length,
      performanceSettings: Object.keys(this.config.performance).length,
      totalSettings: Object.keys(this.config.analysis).length + 
                    Object.keys(this.config.signals).length + 
                    Object.keys(this.config.risk).length + 
                    Object.keys(this.config.performance).length + 
                    Object.keys(this.config.notifications).length + 
                    Object.keys(this.config.display).length
    };
  }
}

// Export singleton instance
export const configManagerService = new ConfigManagerService();