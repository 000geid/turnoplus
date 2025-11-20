# Tooltip Configuration

## Overview

TurnoPlus implements a custom tooltip system with enhanced delay timing and brand-consistent styling across the entire application.

## Configuration

### Global Settings

The tooltip configuration is defined in [`frontend/src/app/app.config.ts`](frontend/src/app/app.config.ts):

```typescript
// Custom tooltip configuration with 1000ms delay and brand styling
export const customTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 1000,    // 1 second delay before showing tooltip
  hideDelay: 0,       // Immediate hide when mouse leaves
  touchendHideDelay: 0 // Immediate hide on touch end
};
```

### Provider Setup

The configuration is applied globally through the Angular dependency injection system:

```typescript
{ provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: customTooltipDefaults }
```

## Styling

### Brand Colors

Tooltips use the application's brand colors defined in [`frontend/src/styles.scss`](frontend/src/styles.scss):

- **Background**: `--brand-700` (#0e7490) - Primary brand color
- **Text**: White (#ffffff) for optimal contrast
- **Shadow**: Subtle shadow for depth

### CSS Implementation

```scss
// Enhanced tooltip system with brand styling
.mat-mdc-tooltip {
  background-color: var(--brand-700) !important;
  color: white !important;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--space-1);
  box-shadow: var(--shadow-lg);
  border: none !important;
  max-width: 300px;
  word-wrap: break-word;
  white-space: pre-line;
}
```

## Usage

### Basic Usage

Tooltips are automatically applied to any element using Angular Material's `matTooltip` directive:

```html
<button matTooltip="This is a tooltip message">Hover me</button>
```

### Advanced Options

Individual components can override the global settings:

```html
<button
  matTooltip="Custom tooltip"
  matTooltipShowDelay="500"
  matTooltipHideDelay="200">
  Custom timing
</button>
```

## Components Using Tooltips

### Dashboard Sidebar

The main navigation sidebar uses tooltips for collapsed state navigation:

```html
<a mat-list-item [matTooltip]="mobileOpen ? '' : item.label" matTooltipPosition="right">
  <!-- Navigation item content -->
</a>
```

## Accessibility

- **Keyboard Navigation**: Tooltips are accessible via keyboard focus
- **Screen Readers**: Proper ARIA attributes are maintained
- **Color Contrast**: White text on brand-700 background meets WCAG AA standards
- **Timing**: 1000ms delay prevents accidental activation

## Performance Considerations

- **Lazy Loading**: Tooltip styles are included in the main bundle
- **Minimal Overhead**: Uses Angular Material's optimized tooltip system
- **Global Configuration**: Reduces per-component configuration overhead

## Customization

### Modifying Delay Times

To change the global delay, update the `customTooltipDefaults` object:

```typescript
export const customTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 1500,    // Increase to 1.5 seconds
  hideDelay: 300,     // Add small hide delay
  touchendHideDelay: 300
};
```

### Custom Styling

For component-specific styling, add custom CSS classes:

```html
<button matTooltip="Message" matTooltipClass="custom-tooltip">Button</button>
```

```scss
.custom-tooltip {
  background-color: var(--color-primary) !important;
  font-weight: bold;
}
```

## Testing

### Unit Testing

Test tooltip behavior using Angular Material's testing utilities:

```typescript
import { MatTooltipHarness } from '@angular/material/tooltip/testing';

it('should show tooltip after delay', async () => {
  const tooltip = await loader.getHarness(MatTooltipHarness);
  await tooltip.show();
  expect(await tooltip.isOpen()).toBe(true);
});
```

### Visual Testing

Verify tooltip appearance matches design specifications:
- Background color: #0e7490
- Text color: #ffffff
- Border radius: 6px
- Shadow: Appropriate depth

## Future Enhancements

### Planned Features

1. **Animated Transitions**: Smooth fade-in/fade-out animations
2. **Rich Content**: Support for HTML content in tooltips
3. **Positioning Options**: Enhanced positioning logic for edge cases
4. **Theme Variants**: Light/dark theme support

### Extension Points

The tooltip system is designed to be extensible:
- Custom tooltip components can extend the base functionality
- Additional providers can be added for specific use cases
- CSS custom properties allow easy theming

## Troubleshooting

### Enhanced Directive

For more advanced tooltip usage, use the custom `appTooltip` directive:

```html
<button [appTooltip]="'Enhanced tooltip message'" tooltipPosition="above">Hover me</button>
```

The directive provides:
- Consistent brand styling
- Programmatic control methods (`show()`, `hide()`, `toggle()`)
- Event outputs for show/hide events
- Automatic application of global configuration

## Components Using Tooltips

### Dashboard Sidebar

The main navigation sidebar uses tooltips for collapsed state navigation:

```html
<a mat-list-item [matTooltip]="mobileOpen ? '' : item.label" matTooltipPosition="right">
  <!-- Navigation item content -->
</a>
```

### Enhanced Directive Usage

For components requiring programmatic tooltip control:

```typescript
import { TooltipDirective } from '@shared/directives/tooltip.directive';

export class MyComponent {
  @ViewChild(TooltipDirective) tooltip!: TooltipDirective;

  showTooltip() {
    this.tooltip.show();
  }
}
```

## Accessibility

- **Keyboard Navigation**: Tooltips are accessible via keyboard focus
- **Screen Readers**: Proper ARIA attributes are maintained
- **Color Contrast**: White text on brand-700 background meets WCAG AA standards
- **Timing**: 1000ms delay prevents accidental activation

## Performance Considerations

- **Lazy Loading**: Tooltip styles are included in the main bundle
- **Minimal Overhead**: Uses Angular Material's optimized tooltip system
- **Global Configuration**: Reduces per-component configuration overhead

## Customization

### Modifying Delay Times

To change the global delay, update the `customTooltipDefaults` object:

```typescript
export const customTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 1500,    // Increase to 1.5 seconds
  hideDelay: 300,     // Add small hide delay
  touchendHideDelay: 300
};
```

### Custom Styling

For component-specific styling, add custom CSS classes:

```html
<button matTooltip="Message" matTooltipClass="custom-tooltip">Button</button>
```

```scss
.custom-tooltip {
  background-color: var(--color-primary) !important;
  font-weight: bold;
}
```

## Testing

### Unit Testing

Test tooltip behavior using Angular Material's testing utilities:

```typescript
import { MatTooltipHarness } from '@angular/material/tooltip/testing';

it('should show tooltip after delay', async () => {
  const tooltip = await loader.getHarness(MatTooltipHarness);
  await tooltip.show();
  expect(await tooltip.isOpen()).toBe(true);
});
```

### Visual Testing

Verify tooltip appearance matches design specifications:
- Background color: #0e7490
- Text color: #ffffff
- Border radius: 6px
- Shadow: Appropriate depth

## Future Enhancements

### Planned Features

1. **Animated Transitions**: Smooth fade-in/fade-out animations
2. **Rich Content**: Support for HTML content in tooltips
3. **Positioning Options**: Enhanced positioning logic for edge cases
4. **Theme Variants**: Light/dark theme support

### Extension Points

The tooltip system is designed to be extensible:
- Custom tooltip components can extend the base functionality
- Additional providers can be added for specific use cases
- CSS custom properties allow easy theming

## Troubleshooting

### Common Issues

1. **Tooltip not showing**: Check that `matTooltip` directive is properly imported
2. **Styling not applied**: Ensure global styles are loaded before component styles
3. **Delay not working**: Verify `MAT_TOOLTIP_DEFAULT_OPTIONS` provider is configured

### Debug Tips

- Use browser dev tools to inspect tooltip elements
- Check console for Angular Material warnings
- Verify CSS custom properties are defined

## Related Files

- [`frontend/src/app/app.config.ts`](frontend/src/app/app.config.ts) - Global configuration
- [`frontend/src/styles.scss`](frontend/src/styles.scss) - Global styling
- [`frontend/src/app/shared/directives/tooltip.directive.ts`](frontend/src/app/shared/directives/tooltip.directive.ts) - Enhanced directive
- [`frontend/src/app/shared/components/dashboard-sidebar/dashboard-sidebar.component.html`](frontend/src/app/shared/components/dashboard-sidebar/dashboard-sidebar.component.html) - Usage example

## Version History

- **v1.0**: Initial implementation with 1000ms delay and brand styling
- **v1.1**: Added enhanced `appTooltip` directive for programmatic control
- **Future**: Enhanced animations and rich content support
### Common Issues

1. **Tooltip not showing**: Check that `matTooltip` directive is properly imported
2. **Styling not applied**: Ensure global styles are loaded before component styles
3. **Delay not working**: Verify `MAT_TOOLTIP_DEFAULT_OPTIONS` provider is configured

### Debug Tips

- Use browser dev tools to inspect tooltip elements
- Check console for Angular Material warnings
- Verify CSS custom properties are defined

## Related Files

- [`frontend/src/app/app.config.ts`](frontend/src/app/app.config.ts) - Global configuration
- [`frontend/src/styles.scss`](frontend/src/styles.scss) - Global styling
- [`frontend/src/app/shared/components/dashboard-sidebar/dashboard-sidebar.component.html`](frontend/src/app/shared/components/dashboard-sidebar/dashboard-sidebar.component.html) - Usage example

## Version History

- **v1.0**: Initial implementation with 1000ms delay and brand styling
- **Future**: Enhanced animations and rich content support