import { LEAGUES } from "@/lib/leagues";

export default function SubmitForm({
  name,
  setName,
  email,
  setEmail,
  onSubmit,
  isSubmitting,
  canSubmit,
  submitted,
  error,
}: {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  submitted: boolean;
  error: string | null;
}) {
  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="text-2xl mb-2">🎉</div>
        <p className="text-green-700 font-semibold">Your prediction has been submitted!</p>
        <p className="text-green-600 text-sm mt-1">Good luck!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
      <h2 className="text-base font-bold text-gray-700">Your Details</h2>
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          League <span className="text-red-500">*</span>
        </label>
        <select
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {LEAGUES.map((league) => (
            <option key={league} value={league}>{league}</option>
          ))}
        </select>
      </div>
      {error && (
        <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}
      <button
        onClick={onSubmit}
        disabled={!canSubmit || isSubmitting}
        className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
          canSubmit && !isSubmitting
            ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {isSubmitting ? "Submitting…" : "Submit Prediction"}
      </button>
      {!canSubmit && (
        <p className="text-xs text-gray-400 text-center">
          Select exactly 8 third-place teams and enter your name to submit
        </p>
      )}
    </div>
  );
}
