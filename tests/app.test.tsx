import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '@/app/App';

describe('rAthena Studio App Component', () => {
  it('renders application title, identity and initial landing screen', () => {
    render(<App />);

    // Brand and subtitle
    expect(screen.getAllByText('rAthena Studio').length).toBeGreaterThan(0);
    expect(screen.getByText('Development Environment for rAthena')).toBeInTheDocument();

    // Workspace status
    expect(screen.getByText('No workspace selected')).toBeInTheDocument();
    expect(screen.getByText('Open rAthena Workspace')).toBeInTheDocument();
  });
});
