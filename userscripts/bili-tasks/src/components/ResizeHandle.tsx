import { JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import './ResizeHandle.css';

interface ResizeHandleProps {
  onMouseDown: (e: MouseEvent) => void;
  isDragging: boolean;
}

export function ResizeHandle({ onMouseDown, isDragging }: ResizeHandleProps): JSX.Element {
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleElement = handleRef.current;
    if (!handleElement) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      onMouseDown(e);
    };

    handleElement.addEventListener('mousedown', handleMouseDown);

    return () => {
      handleElement.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onMouseDown]);

  return (
    <div
      ref={handleRef}
      class={`resize-handle ${isDragging ? 'resize-handle--dragging' : ''}`}
      title="拖拽调整面板宽度"
    >
      <div class="resize-handle-line"></div>
      <div class="resize-handle-grip">
        <div class="resize-handle-dot"></div>
        <div class="resize-handle-dot"></div>
        <div class="resize-handle-dot"></div>
        <div class="resize-handle-dot"></div>
        <div class="resize-handle-dot"></div>
        <div class="resize-handle-dot"></div>
      </div>
    </div>
  );
}
