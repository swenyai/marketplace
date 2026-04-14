"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import type { Workflow } from "@sweny-ai/core";

const DagViewer = dynamic(() => import("./DagViewer"), {
  ssr: false,
  loading: () => <DagSkeleton />,
});

function DagSkeleton() {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      role="status"
      aria-label="Loading workflow graph"
    >
      <div className="grid grid-cols-3 gap-4 opacity-40">
        <div className="w-36 h-16 rounded-md bg-surface-2 animate-pulse" />
        <div className="w-36 h-16 rounded-md bg-surface-2 animate-pulse" />
        <div className="w-36 h-16 rounded-md bg-surface-2 animate-pulse" />
        <div className="w-36 h-16 rounded-md bg-surface-2 animate-pulse col-start-2" />
      </div>
    </div>
  );
}

interface DagModalProps {
  open: boolean;
  onClose: () => void;
  workflow: Workflow;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function DagModal({ open, onClose, workflow }: DagModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    // Preserve prior body overflow so we don't clobber an outer lock.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Capture the element that opened the modal so we can restore focus on close.
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    // Move focus into the dialog (close button is safe initial focus).
    closeBtnRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      // Focus trap: cycle focus within the dialog.
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
      // Restore focus to the element that opened the modal.
      trigger?.focus();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const modal = (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[100] bg-bg/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={`${workflow.name ?? "Workflow"} graph`}
      onClick={(e) => {
        // Click on backdrop (the dialog container itself) closes the modal.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex justify-between items-center px-4 md:px-6 py-3 border-b border-border flex-shrink-0">
        <div className="font-mono text-[11px] text-accent">
          // {workflow.id} · workflow graph
        </div>
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Close workflow graph"
          className="text-text-dim hover:text-text text-xl leading-none min-w-[44px] min-h-[44px] flex items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          ×
        </button>
      </div>
      <div className="flex-1 marketplace-dag dag-host">
        <DagViewer workflow={workflow} height="100%" nodeWidth={200} nodeHeight={70} />
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
