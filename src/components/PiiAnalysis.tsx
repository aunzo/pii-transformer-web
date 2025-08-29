import { analyzePiiData } from '@/utils/piiTransformer';

interface PiiAnalysisProps {
  text: string;
}

export default function PiiAnalysis({ text }: PiiAnalysisProps) {
  if (!text.trim()) {
    return null;
  }

  const analysis = analyzePiiData(text);

  if (!analysis.hasAnyPii) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4 animate-fade-in">
        <div className="flex items-center text-sm text-blue-800 dark:text-blue-200">
          <span className="mr-2">ℹ️</span>
          No PII detected in the current text.
        </div>
      </div>
    );
  }

  const detectedTypes = Object.entries(analysis.stats)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({ type, count }));

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
            <span className="mr-2">⚠️</span>
            found pii data
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {detectedTypes.map(({ type, count }, index) => (
              <div
                key={type}
                className="flex items-center justify-between bg-yellow-100 dark:bg-yellow-800/30 px-2 py-1 rounded text-xs animate-slide-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                  {type}
                </span>
                <span className="text-yellow-600 dark:text-yellow-300 font-bold">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}