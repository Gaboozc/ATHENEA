import React from 'react';

export interface ActionChipItem {
  id: string;
  label: string;
  intent: string;
  persona?: 'cortana' | 'jarvis' | 'shodan' | 'swarm';
}

interface ActionChipsProps {
  chips: ActionChipItem[];
  onExecute: (chip: ActionChipItem) => void;
  disabled?: boolean;
}

export const ActionChips: React.FC<ActionChipsProps> = ({ chips, onExecute, disabled = false }) => {
  if (!chips.length) return null;

  return (
    <div className="action-chips-wrap" aria-label="Contextual action chips">
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className={`action-chip-btn action-chip-${chip.persona || 'swarm'}`}
          disabled={disabled}
          onClick={() => onExecute(chip)}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
};

export default ActionChips;
