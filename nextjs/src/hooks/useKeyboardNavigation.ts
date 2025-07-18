import { useEffect, useRef } from 'react';

export interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: (shiftKey: boolean) => void;
  disabled?: boolean;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    disabled = false
  } = options;

  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        case 'Enter':
          if (onEnter && !event.shiftKey && !event.ctrlKey && !event.altKey) {
            event.preventDefault();
            onEnter();
          }
          break;
        case 'ArrowUp':
          if (onArrowUp) {
            event.preventDefault();
            onArrowUp();
          }
          break;
        case 'ArrowDown':
          if (onArrowDown) {
            event.preventDefault();
            onArrowDown();
          }
          break;
        case 'ArrowLeft':
          if (onArrowLeft) {
            event.preventDefault();
            onArrowLeft();
          }
          break;
        case 'ArrowRight':
          if (onArrowRight) {
            event.preventDefault();
            onArrowRight();
          }
          break;
        case 'Tab':
          if (onTab) {
            event.preventDefault();
            onTab(event.shiftKey);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab, disabled]);
}

// 焦点管理 Hook
export function useFocusManagement() {
  const focusableElementsRef = useRef<HTMLElement[]>([]);

  // 获取页面上所有可焦点元素
  const getFocusableElements = (): HTMLElement[] => {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(document.querySelectorAll(selectors));
  };

  // 聚焦到第一个可焦点元素
  const focusFirst = () => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[0].focus();
    }
  };

  // 聚焦到最后一个可焦点元素
  const focusLast = () => {
    const elements = getFocusableElements();
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
    }
  };

  // 聚焦到下一个元素
  const focusNext = () => {
    const elements = getFocusableElements();
    const currentIndex = elements.indexOf(document.activeElement as HTMLElement);
    const nextIndex = (currentIndex + 1) % elements.length;
    if (elements[nextIndex]) {
      elements[nextIndex].focus();
    }
  };

  // 聚焦到上一个元素
  const focusPrevious = () => {
    const elements = getFocusableElements();
    const currentIndex = elements.indexOf(document.activeElement as HTMLElement);
    const prevIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
    if (elements[prevIndex]) {
      elements[prevIndex].focus();
    }
  };

  // 陷阱焦点在容器内
  const trapFocus = (container: HTMLElement) => {
    const elements = container.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (elements.length === 0) return;

    const firstElement = elements[0];
    const lastElement = elements[elements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // 返回清理函数
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  };

  return {
    getFocusableElements,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    trapFocus
  };
}

// 屏幕阅读器公告 Hook
export function useScreenReader() {
  const announceRef = useRef<HTMLDivElement | null>(null);

  // 创建隐藏的公告元素
  useEffect(() => {
    if (!announceRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      announcer.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(announcer);
      announceRef.current = announcer;
    }

    return () => {
      if (announceRef.current) {
        document.body.removeChild(announceRef.current);
        announceRef.current = null;
      }
    };
  }, []);

  // 公告文本给屏幕阅读器
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announceRef.current) {
      announceRef.current.setAttribute('aria-live', priority);
      announceRef.current.textContent = message;
      
      // 清空内容，确保重复消息也能被读出
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = '';
        }
      }, 1000);
    }
  };

  return { announce };
} 