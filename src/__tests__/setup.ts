import { vi } from "vitest";
import React from "react";
import "@testing-library/jest-dom/vitest";

// Make React available globally
global.React = React;

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL = global.URL || Object.create(null);
global.URL.createObjectURL = vi.fn(() => "blob:http://test");
global.URL.revokeObjectURL = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as Storage;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock as Storage;
