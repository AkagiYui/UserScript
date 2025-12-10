import { JSX } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { ModalProps } from '@/types';
import './Modal.css';

export function Modal({ isOpen, onClose, children }: ModalProps): JSX.Element | null {
  const [isClosing, setIsClosing] = useState(false);

  // 控制背景滚动
  useEffect(() => {
    if (isOpen) {
      // 保存当前的overflow样式
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      // 获取滚动条宽度
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

      // 禁用滚动并补偿滚动条宽度
      document.body.style.overflow = 'hidden';
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      // 清理函数：恢复原有样式
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    // 等待动画完成后再调用onClose
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen && !isClosing) {
    return null;
  }

  return (
    <div
      class={`modal-backdrop ${isClosing ? 'modal-backdrop--closing' : ''}`}
      onClick={handleBackdropClick}
    >
      <div class={`modal-content ${isClosing ? 'modal-content--closing' : ''}`}>
        <div class="modal-header">
          <div class="modal-header-info">
            <span class="modal-title">【哔哩哔哩】一些任务</span>
            <a
              href="https://github.com/AkagiYui"
              target="_blank"
              rel="noopener noreferrer"
              class="modal-repo-link"
              title="访问作者仓库"
            >
              AkagiYui
            </a>
          </div>
          <button
            class="modal-close-button"
            onClick={handleClose}
            title="关闭面板"
            aria-label="关闭面板"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 9L12 16L5 9"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
