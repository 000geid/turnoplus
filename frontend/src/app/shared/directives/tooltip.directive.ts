import { Directive, Input } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

/**
 * Enhanced tooltip directive that extends Angular Material's MatTooltip
 * with consistent brand styling and behavior.
 *
 * Usage:
 * <button [appTooltip]="'Tooltip message'" tooltipPosition="above">Hover me</button>
 */
@Directive({
  selector: '[appTooltip]',
  standalone: true,
  hostDirectives: [{
    directive: MatTooltip,
    inputs: ['matTooltip: appTooltip', 'matTooltipPosition: tooltipPosition', 'matTooltipClass: tooltipClass']
  }]
})
export class TooltipDirective {
  @Input() tooltipPosition: 'above' | 'below' | 'left' | 'right' | 'before' | 'after' = 'below';
  @Input() tooltipClass = 'app-tooltip';

  constructor(private matTooltip: MatTooltip) {}

  /**
   * Programmatically show the tooltip
   */
  show(): void {
    this.matTooltip.show();
  }

  /**
   * Programmatically hide the tooltip
   */
  hide(): void {
    this.matTooltip.hide();
  }

  /**
   * Toggle the tooltip visibility
   */
  toggle(): void {
    this.matTooltip.toggle();
  }
}