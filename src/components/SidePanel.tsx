import { TEAM_FLAGS } from "@/lib/groups";

export default function SidePanel({
  selections,
  groups,
}: {
  selections: Record<string, boolean>;
  groups: Record<string, string[]>;
}) {
  const selectedCount = Object.values(selections).filter(Boolean).length;
  const groupKeys = Object.keys(groups).sort();

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-700">3rd Place Advances</h2>
        <span
          className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
            selectedCount === 8
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {selectedCount} / 8
        </span>
      </div>
      <ul className="space-y-1">
        {groupKeys.map((key) => {
          const thirdTeam = groups[key]?.[2];
          const isSelected = selections[key] ?? false;
          return (
            <li
              key={key}
              className={`flex items-center gap-2 text-sm rounded px-2 py-1 ${
                isSelected ? "text-gray-800" : "text-gray-400"
              }`}
            >
              <span className="font-semibold w-4">{key}</span>
              <span className="text-gray-300">—</span>
              {isSelected ? (
                <span className="font-medium">
                  {TEAM_FLAGS[thirdTeam] && <span className="mr-1">{TEAM_FLAGS[thirdTeam]}</span>}
                  {thirdTeam}
                </span>
              ) : (
                <span className="italic text-gray-300">not selected</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
