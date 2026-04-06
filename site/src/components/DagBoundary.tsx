"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Optional label shown above the error message. */
  label?: string;
}

interface State {
  error: Error | null;
}

/**
 * Error boundary for the DAG viewer. The `@sweny-ai/studio` viewer
 * renders an inline light-theme error panel when ELK layout fails,
 * which clashes badly with the marketplace's dark UI. We catch
 * render-time errors up here and render a dark-themed fallback.
 *
 * Note: this does NOT catch errors thrown inside async layout
 * promises — those are handled by studio internally and show the
 * light-theme panel. That's why we also normalize workflow input
 * before passing it to the viewer (see normalizeWorkflow).
 */
export class DagBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prevProps: Props) {
    // Reset when children identity changes — a new workflow means a
    // fresh render attempt.
    if (prevProps.children !== this.props.children && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-6 gap-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider">
            {this.props.label ?? "DAG preview unavailable"}
          </div>
          <div className="text-xs text-red-400/80 font-mono max-w-md break-words">
            {this.state.error.message}
          </div>
          <div className="text-[10px] text-gray-600 mt-2">
            The YAML may still be valid — this panel just couldn&rsquo;t
            render it.
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
