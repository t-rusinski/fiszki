import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, fireEvent } from '@/test/test-utils';

// Example React component for demonstration
function Button({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} type="button">
      {children}
    </button>
  );
}

describe('Button Component', () => {
  it('should render button with text', () => {
    // Arrange
    const handleClick = vi.fn();

    // Act
    renderWithProviders(<Button onClick={handleClick}>Click me</Button>);

    // Assert
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    // Arrange
    const handleClick = vi.fn();
    renderWithProviders(<Button onClick={handleClick}>Click me</Button>);

    // Act
    const button = screen.getByRole('button', { name: /click me/i });
    fireEvent.click(button);

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple clicks', () => {
    // Arrange
    const handleClick = vi.fn();
    renderWithProviders(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });

    // Act
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(3);
  });
});
