"use client";

import { TEAM_FLAGS } from "@/lib/groups";

const ORDINALS = ["1st", "2nd", "3rd", "4th"];

function TeamRow({
  id,
  index,
  total,
  isThird,
  isSelected,
  onToggle,
  onMoveUp,
  onMoveDown,
}: {
  id: string;
  index: number;
  total: number;
  isThird: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 mb-1 bg-white hover:bg-gray-50 border border-gray-200 select-none">
      {/* Position */}
      <span className="text-xs font-semibold text-gray-400 w-7 shrink-0">
        {ORDINALS[index]}
      </span>
      {/* Team name */}
      <span className="flex-1 text-sm font-medium text-gray-800">
        {TEAM_FLAGS[id] && <span className="mr-1">{TEAM_FLAGS[id]}</span>}
        {id}
      </span>
      {/* Up/down buttons */}
      <div className="flex flex-col shrink-0">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          aria-label="Move up"
          className="flex items-center justify-center w-10 h-5 text-gray-500 hover:text-gray-800 disabled:opacity-20 disabled:cursor-not-allowed"
        >
          ▲
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          aria-label="Move down"
          className="flex items-center justify-center w-10 h-5 text-gray-500 hover:text-gray-800 disabled:opacity-20 disabled:cursor-not-allowed"
        >
          ▼
        </button>
      </div>
      {/* Checkbox only for 3rd place */}
      {isThird && (
        <label className="flex items-center gap-1 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            className="w-4 h-4 accent-green-600"
          />
          <span className="text-xs text-gray-500">advances</span>
        </label>
      )}
    </div>
  );
}

export default function GroupCard({
  groupKey,
  teams,
  isThirdSelected,
  onReorder,
  onToggleThird,
}: {
  groupKey: string;
  teams: string[];
  isThirdSelected: boolean;
  onReorder: (newTeams: string[]) => void;
  onToggleThird: () => void;
}) {
  function moveUp(index: number) {
    if (index === 0) return;
    const newList = [...teams];
    [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
    onReorder(newList);
  }

  function moveDown(index: number) {
    if (index === teams.length - 1) return;
    const newList = [...teams];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    onReorder(newList);
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm">
      <h2 className="text-base font-bold text-gray-700 mb-3">Group {groupKey}</h2>
      {teams.map((team, index) => (
        <TeamRow
          key={team}
          id={team}
          index={index}
          total={teams.length}
          isThird={index === 2}
          isSelected={isThirdSelected}
          onToggle={onToggleThird}
          onMoveUp={() => moveUp(index)}
          onMoveDown={() => moveDown(index)}
        />
      ))}
    </div>
  );
}
