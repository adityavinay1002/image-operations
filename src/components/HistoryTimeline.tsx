import { Undo2, Redo2, Clock, Download, RotateCcw } from 'lucide-react';
import { Operation } from '../types';

interface HistoryTimelineProps {
  operations: Operation[];
  currentIndex: number;
  onUndo: () => void;
  onRedo: () => void;
  onJumpToState: (index: number) => void;
  onDownload: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasImage: boolean;
}

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({
  operations,
  currentIndex,
  onUndo,
  onRedo,
  onJumpToState,
  onDownload,
  onReset,
  canUndo,
  canRedo,
  hasImage,
  onDeleteOperation,
}) => {
  return (
    <div className="bg-slate-800/50 rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-slate-400" />
        <h3 className="text-lg font-semibold text-slate-200">Operation History</h3>
      </div>

      <div className="min-h-[120px] bg-slate-900/50 rounded-lg p-4">
        {operations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            No operations yet
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {operations.map((op, index) => {
              const historyPos = index + 1;
              const isActive = historyPos === currentIndex;
              const isBefore = historyPos < currentIndex;
              return (
                <div
                  key={op.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onJumpToState(historyPos)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onJumpToState(historyPos);
                    }
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : isBefore
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{op.name}</div>
                      <div className="text-xs text-slate-400">{new Date(op.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-slate-300">{historyPos}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
