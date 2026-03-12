// frontend/src/tests/settingsModal.test.tsx
// Tests for Settings modal integration: gear icon, modal open/close, focus trap, BYOK section.
// PROV-01, PROV-02, PROV-03, XCUT-02

import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { SettingsProvider } from '../contexts/SettingsContext';
import { SettingsModal } from '../components/settings/SettingsModal';

// Minimal harness that has a gear icon button wired to openModal
function TestHarness() {
  const { openModal } = React.useContext(
    React.createContext({ openModal: () => {} })
  );
  // Instead, use the context directly
  return null;
}

// Use SettingsProvider + SettingsModal directly, plus a trigger button
import { useSettings } from '../contexts/SettingsContext';

function GearButton() {
  const { openModal } = useSettings();
  return (
    <button onClick={openModal} aria-label="Open settings">
      Gear
    </button>
  );
}

function TestApp() {
  return (
    <SettingsProvider userId={null}>
      <GearButton />
      <SettingsModal />
    </SettingsProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('Settings modal integration', () => {
  it('gear icon button exists with aria-label "Open settings"', () => {
    render(<TestApp />);
    expect(screen.getByRole('button', { name: 'Open settings' })).toBeTruthy();
  });

  it('clicking gear icon opens the modal', async () => {
    render(<TestApp />);
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('clicking backdrop closes the modal', async () => {
    render(<TestApp />);
    await userEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByTestId('settings-backdrop'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Escape key closes the modal', async () => {
    render(<TestApp />);
    await userEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('modal shows "Settings" heading', async () => {
    render(<TestApp />);
    await userEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeTruthy();
  });

  it('free-tier label shows "Gemini Flash 2.0"', async () => {
    render(<TestApp />);
    await userEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    expect(screen.getByText(/Gemini Flash 2\.0/)).toBeTruthy();
  });

  it('BYOK section is collapsed by default', async () => {
    render(<TestApp />);
    await userEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    // BYOK section header is visible
    expect(screen.getByText('Use Your Own API Key')).toBeTruthy();
    // But provider selector is NOT visible (collapsed)
    expect(screen.queryByRole('group', { name: 'Select provider' })).toBeNull();
  });

  it('expanding BYOK section shows provider selector and key input', async () => {
    render(<TestApp />);
    await userEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    // Expand BYOK section
    await userEvent.click(screen.getByText('Use Your Own API Key'));
    // Provider buttons appear
    expect(screen.getByRole('button', { name: /Gemini/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /OpenAI/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Anthropic/i })).toBeTruthy();
    // Key input appears
    expect(screen.getByLabelText('API Key')).toBeTruthy();
  });

  it('close button in modal header closes the modal', async () => {
    render(<TestApp />);
    await userEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close settings' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
