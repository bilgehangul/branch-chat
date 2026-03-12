// frontend/src/tests/settingsContext.test.ts
// Tests for SettingsContext — tier/provider/key state management.
// PROV-01, PROV-02, PROV-03

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { SettingsProvider, useSettings } from '../contexts/SettingsContext';

// Wrapper for renderHook
function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(SettingsProvider, { userId: null }, children);
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('SettingsContext defaults', () => {
  it('defaults to tier=free, byokProvider=null, byokKeyVerified=false, isModalOpen=false', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    expect(result.current.tier).toBe('free');
    expect(result.current.byokProvider).toBeNull();
    expect(result.current.byokModel).toBeNull();
    expect(result.current.byokApiKey).toBeNull();
    expect(result.current.byokKeyVerified).toBe(false);
    expect(result.current.isModalOpen).toBe(false);
  });
});

describe('SettingsContext actions', () => {
  it('openModal sets isModalOpen to true', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    act(() => result.current.openModal());
    expect(result.current.isModalOpen).toBe(true);
  });

  it('closeModal sets isModalOpen to false', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    act(() => result.current.openModal());
    act(() => result.current.closeModal());
    expect(result.current.isModalOpen).toBe(false);
  });

  it('setByokProvider updates provider and resets model/verified', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    // Manually set a model and verified state first
    act(() => result.current.setByokProvider('openai'));
    expect(result.current.byokProvider).toBe('openai');
    expect(result.current.byokModel).toBeNull();
    expect(result.current.byokKeyVerified).toBe(false);
  });

  it('setByokProvider switching resets model and verified', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    act(() => result.current.setByokProvider('gemini'));
    act(() => result.current.setByokProvider('anthropic'));
    expect(result.current.byokProvider).toBe('anthropic');
    expect(result.current.byokModel).toBeNull();
    expect(result.current.byokKeyVerified).toBe(false);
  });

  it('setByokApiKey stores key in memory only', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    act(() => result.current.setByokApiKey('sk-test-key'));
    expect(result.current.byokApiKey).toBe('sk-test-key');
    // Should NOT be in localStorage directly (only via saveByokSettings)
    expect(localStorage.getItem('byok_key_null')).toBeNull();
  });
});

describe('SettingsContext clearByokKey', () => {
  it('clearByokKey resets to free tier and clears state', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });
    act(() => {
      result.current.setByokProvider('openai');
      result.current.setByokApiKey('sk-test');
    });
    act(() => result.current.clearByokKey(null));
    expect(result.current.tier).toBe('free');
    expect(result.current.byokProvider).toBeNull();
    expect(result.current.byokApiKey).toBeNull();
    expect(result.current.byokKeyVerified).toBe(false);
  });
});
