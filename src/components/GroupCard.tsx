"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TEAM_FLAGS } from "@/lib/groups";

const ORDINALS = ["1st", "2nd", "3rd", "4th"];

function SortableTeam({
  id,
  index,
  isThird,
  isSelected,
  onToggle,
}: {
  id: string;
  index: number;
  isThird: boolean;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 mb-1 ${
        isDragging ? "bg-blue-50 shadow-lg" : "bg-white hover:bg-gray-50"
      } border border-gray-200 select-none`}
    >
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 text-lg"
        aria-label="Drag to reorder"
      >
        ⠿
      </span>
      {/* Position */}
      <span className="text-xs font-semibold text-gray-400 w-7 shrink-0">
        {ORDINALS[index]}
      </span>
      {/* Team name */}
      <span className="flex-1 text-sm font-medium text-gray-800">
        {TEAM_FLAGS[id] && <span className="mr-1">{TEAM_FLAGS[id]}</span>}
        {id}
      </span>
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
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = teams.indexOf(active.id as string);
      const newIndex = teams.indexOf(over.id as string);
      onReorder(arrayMove(teams, oldIndex, newIndex));
    }
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm">
      <h2 className="text-base font-bold text-gray-700 mb-3">Group {groupKey}</h2>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={teams} strategy={verticalListSortingStrategy}>
          {teams.map((team, index) => (
            <SortableTeam
              key={team}
              id={team}
              index={index}
              isThird={index === 2}
              isSelected={isThirdSelected}
              onToggle={onToggleThird}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
