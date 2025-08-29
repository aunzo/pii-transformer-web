import { TransformationResult as TransformationResultType } from '@/utils/piiTransformer';

interface TransformationResultProps {
  result: TransformationResultType | null;
  onCopy: () => void;
}

export default function TransformationResult({ result, onCopy }: TransformationResultProps) {
  if (!result || !result.transformedText) {
    return (
      <div className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 overflow-y-auto">
        <p className="text-gray-500 dark:text-gray-400 italic">
          Transformed text will appear here...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics */}
      {result.transformationCount > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 animate-fade-in">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-800 dark:text-green-200 font-medium">
              ✓ {result.transformationCount} PII item{result.transformationCount !== 1 ? 's' : ''} detected and transformed
            </span>
            <div className="flex gap-2">
              {result.detectedPiiTypes.map((type, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs font-medium animate-slide-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transformed Text Display */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Transformed Text:</h3>
          <div className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 overflow-y-auto animate-fade-in">
            <pre className="whitespace-pre-wrap text-gray-900 dark:text-white font-mono text-sm">
              {result.transformedText}
            </pre>
          </div>
          <div className="flex justify-end mt-2">
            <button
              onClick={onCopy}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium hover:scale-105 focus-ring transition-all duration-200"
            >
              📋 Copy Transformed
            </button>
          </div>
        </div>

        {/* SHA256 Hash Display */}
        {result.hashedText && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SHA256 Hash:</h3>
            <div className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 overflow-y-auto animate-fade-in">
              <pre className="whitespace-pre-wrap text-gray-900 dark:text-white font-mono text-sm break-all">
                {result.hashedText}
              </pre>
            </div>
            <div className="flex justify-end mt-2">
              <button
                onClick={() => navigator.clipboard.writeText(result.hashedText || '')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium hover:scale-105 focus-ring transition-all duration-200"
              >
                📋 Copy Hash
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}