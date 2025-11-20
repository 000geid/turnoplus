import { InjectionToken } from '@angular/core';

export interface EnvironmentConfig {
  production: boolean;
  API_URL: string;
}

export const ENVIRONMENT_CONFIG = new InjectionToken<EnvironmentConfig>('environment.config');