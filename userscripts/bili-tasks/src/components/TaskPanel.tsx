import { JSX } from 'preact';
import { TaskPanelProps } from '@/types';
import { ScriptManager } from './ScriptManager';
import './TaskPanel.css';

export function TaskPanel(_props: TaskPanelProps = {}): JSX.Element {

  return (
    <div class="task-panel">
      <ScriptManager />
    </div>
  );
}
