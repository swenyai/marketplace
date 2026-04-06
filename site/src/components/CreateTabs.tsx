"use client";

import { useState } from "react";
import { CreatePrompt } from "./CreatePrompt";
import { E2eWizard } from "./E2eWizard";

type Tab = "prompt" | "e2e";

export function CreateTabs() {
  const [tab, setTab] = useState<Tab>("prompt");

  return (
    <div>
      <div className="flex border-b border-[#1e1e2e] mb-6 overflow-x-auto">
        <button
          onClick={() => setTab("prompt")}
          className={`px-4 py-3 md:py-2 text-sm font-medium transition whitespace-nowrap ${
            tab === "prompt"
              ? "text-blue-400 border-b-2 border-blue-500"
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          AI Prompt
        </button>
        <button
          onClick={() => setTab("e2e")}
          className={`px-4 py-3 md:py-2 text-sm font-medium transition whitespace-nowrap ${
            tab === "e2e"
              ? "text-blue-400 border-b-2 border-blue-500"
              : "text-gray-500 hover:text-gray-300"
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
