"use client";

import { useState } from "react";
import { CreatePrompt } from "./CreatePrompt";
import { E2eWizard } from "./E2eWizard";

type Tab = "prompt" | "e2e";

export function CreateTabs() {
  const [tab, setTab] = useState<Tab>("prompt");

  return (
    <div>
      <div className="flex border-b border-border mb-6 overflow-x-auto">
        <button
          onClick={() => setTab("prompt")}
          className={`px-4 py-3 md:py-2 text-sm font-medium transition whitespace-nowrap ${
            tab === "prompt"
              ? "text-accent border-b-2 border-accent"
              : "text-text-dim hover:text-text-muted"
          }`}
        >
          AI Prompt
        </button>
        <button
          onClick={() => setTab("e2e")}
          className={`px-4 py-3 md:py-2 text-sm font-medium transition whitespace-nowrap ${
            tab === "e2e"
              ? "text-accent border-b-2 border-accent"
              : "text-text-dim hover:text-text-muted"
          }`}
        >
          E2E Test Wizard
        </button>
      </div>

      {tab === "prompt" && <CreatePrompt />}
      {tab === "e2e" && <E2eWizard />}
    </div>
  );
}
