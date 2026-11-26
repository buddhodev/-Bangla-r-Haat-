import React from 'react';
import { AlpanaLotusMark } from './AlpanaMotifs';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('Banglaar Haat ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      let friendly = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage) as { error?: string; operationType?: string };
        if (parsed.error) {
          friendly = `Database access notice (${parsed.operationType ?? 'operation'}): ${parsed.error}`;
        }
      } catch {
        // Non-JSON error message
      }

      return (
        <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center px-6 py-12">
          <div className="max-w-lg w-full bg-white border border-[#E4DACB] p-8 text-center">
            <AlpanaLotusMark className="w-12 h-12 text-[#A61C24] mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-[#1C1714] mb-2">
              সাময়িক ত্রুটি দেখা দিয়েছে · Something went wrong
            </h2>
            <p className="text-sm text-[#5C524A] mb-6 leading-relaxed break-words">
              {friendly}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[#A61C24] text-white text-sm font-medium hover:bg-[#88151C] transition-colors cursor-pointer"
            >
              পুনরায় লোড করুন · Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
