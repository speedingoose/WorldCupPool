"use client";

import { useState } from "react";
import { GROUPS, GROUP_KEYS } from "@/lib/groups";
import GroupCard from "@/components/GroupCard";
import SidePanel from "@/components/SidePanel";
import SubmitForm from "@/components/SubmitForm";

export default function Home() {
  const [groups, setGroups] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(GROUP_KEYS.map((k) => [k, [...GROUPS[k]]]))
  );
  const [selections, setSelections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUP_KEYS.map((k) => [k, false]))
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("Consular");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCount = Object.values(selections).filter(Boolean).length;
  const canSubmit = name.trim() !== "" && selectedCount === 8;

  function handleReorder(key: string, newTeams: string[]) {
    setGroups((prev) => ({ ...prev, [key]: newTeams }));
  }

  function handleToggle(key: string) {
    setSelections((prev) => {
      const current = prev[key];
      if (!current && selectedCount >= 8) return prev;
      return { ...prev, [key]: !current };
    });
  }

  async function handleSubmit() {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        email: email,
        groups,
        thirdPlaceAdvances: selections,
      };
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Submission failed. Please try again.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">⚽ World Cup 2026 Pool</h1>
            <p className="text-xs text-gray-500">Rank the teams in each group</p>
          </div>
          <span
            className={`text-sm font-semibold px-3 py-1 rounded-full ${
              selectedCount === 8
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {selectedCount} / 8 selected
          </span>
        </div>
      </header>

      {/* Main layout */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="lg:flex lg:gap-6">
          {/* Groups grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6 lg:mb-0">
            {GROUP_KEYS.map((key) => (
              <GroupCard
                key={key}
                groupKey={key}
                teams={groups[key]}
                isThirdSelected={selections[key]}
                onReorder={(newTeams) => handleReorder(key, newTeams)}
                onToggleThird={() => handleToggle(key)}
              />
            ))}
          </div>

          {/* Side panel + form */}
          <div className="lg:w-72 xl:w-80 space-y-4 lg:sticky lg:top-20 lg:self-start">
            <SidePanel selections={selections} groups={groups} />
            <SubmitForm
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              canSubmit={canSubmit}
              submitted={submitted}
              error={error}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
