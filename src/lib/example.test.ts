import { describe, it, expect, vi } from 'vitest';

describe('Example Unit Test', () => {
  it('should demonstrate basic test structure', () => {
    // Arrange
    const input = 1 + 1;

    // Act
    const result = input;

    // Assert
    expect(result).toBe(2);
  });

  it('should demonstrate mock usage', () => {
    // Create a mock function
    const mockFn = vi.fn((x: number) => x * 2);

    // Use the mock
    const result = mockFn(5);

    // Verify
    expect(result).toBe(10);
    expect(mockFn).toHaveBeenCalledWith(5);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
