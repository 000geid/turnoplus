import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { DatePipe, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions } from '@angular/material/tooltip';

import { routes } from './app.routes';
import { authTokenInterceptor } from './core/interceptors/auth-token.interceptor';
import { environment } from '../environments/environment';
import { ENVIRONMENT_CONFIG } from './core/config/environment.config';

// Angular Material standalone components import their own providers, so we don't need global Material providers

registerLocaleData(localeEs);

// Custom tooltip configuration with 1000ms delay and brand styling
export const customTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 1000,
  hideDelay: 0,
  touchendHideDelay: 0,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authTokenInterceptor])),
    provideAnimations(),
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es-ES' },
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: customTooltipDefaults },
    { provide: ENVIRONMENT_CONFIG, useValue: environment }
  ]
};