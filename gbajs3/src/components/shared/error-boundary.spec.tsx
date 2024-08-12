import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppErrorBoundary } from './error-boundary.tsx';

const ThrowError = () => {
  throw new Error('A test error');
};

describe('<AppErrorBoundary/>', () => {
  it('renders children', async () => {
    render(
      <AppErrorBoundary>
        <p>Everything is fine</p>
      </AppErrorBoundary>
    );
    expect(screen.getByText('Everything is fine')).toBeVisible();
  });

  it('renders fallback on uncaught error', () => {
    render(
      <AppErrorBoundary>
        <ThrowError />
        <p>Everything is fine</p>
      </AppErrorBoundary>
    );

    expect(screen.queryByText('Everything is fine')).not.toBeInTheDocument();
    expect(screen.getByText('A test error')).toBeVisible();
  });
});

describe('fallbackRender', () => {
  it('renders styled fallback', () => {
    render(
      <AppErrorBoundary>
        <ThrowError />
      </AppErrorBoundary>
    );

    expect(screen.getByText('A test error')).toBeVisible();
    // renders header
    expect(screen.getByText('An irrecoverable error occurred')).toBeVisible();
    // renders image
    expect(screen.getByAltText('GameBoy Advance with error icon'));
    // renders font attribution
    expect(screen.getByText('Font by NACreative')).toBeVisible();
    // renders error message
    expect(screen.getByText('A test error')).toBeVisible();
    // renders button steps
    expect(screen.getByText('Copy trace')).toBeVisible();
    expect(screen.getByText('Create issue')).toBeVisible();
    expect(screen.getByText('Dismiss and reset')).toBeVisible();
  });
});
