'use client';

import { useState } from 'react';
import { transformPiiData, backwardTransformPiiData, analyzePiiData, getAvailablePatterns, type TransformationResult } from '@/utils/piiTransformer';
import TransformationResultComponent from '@/components/TransformationResult';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [transformationResult, setTransformationResult] = useState<TransformationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [isBackwardMode, setIsBackwardMode] = useState(false);

  const handleTransformPiiData = async () => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = isBackwardMode 
      ? await backwardTransformPiiData(inputText, passphrase)
      : await transformPiiData(inputText, true, passphrase);
    setTransformationResult(result);
    
    setIsProcessing(false);
  };

  const clearAll = () => {
    setInputText('');
    setTransformationResult(null);
  };

  const handleCopyTransformed = () => {
    if (transformationResult?.transformedText) {
      navigator.clipboard.writeText(transformationResult.transformedText);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
           <div className="text-center mb-8 animate-fade-in">
             <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
               PII Data Transformer
             </h1>
             <p className="text-lg text-gray-600 dark:text-gray-300">
               Transform personally identifiable information (PII) in your text to protect privacy
             </p>
           </div>

          {/* Main Content */}
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Input Text
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {inputText.length} characters
                  </span>
                </div>
                <textarea
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
                   placeholder={isBackwardMode 
                     ? "Enter plain text to encrypt to PGP format..."
                     : "Enter text containing PII data (emails, phone numbers, SSNs, etc.) or encrypted data..."}
                   className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                 />
                
                {/* Transformation Mode Toggle */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Transformation Mode:
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="transformMode"
                        checked={!isBackwardMode}
                        onChange={() => setIsBackwardMode(false)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Forward (Decrypt PGP)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="transformMode"
                        checked={isBackwardMode}
                        onChange={() => setIsBackwardMode(true)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Backward (Encrypt to PGP)</span>
                    </label>
                  </div>
                </div>

                {/* Passphrase Input */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
                  <label htmlFor="passphrase" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Passphrase (required):
                  </label>
                  <input
                    type="password"
                    id="passphrase"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder={isBackwardMode ? "Enter encryption passphrase..." : "Enter decryption passphrase..."}
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus-ring bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                     onClick={handleTransformPiiData}
                     disabled={!inputText.trim() || !passphrase.trim() || isProcessing}
                     className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105 focus-ring flex items-center justify-center gap-2"
                   >
                     {isProcessing ? (
                       <>
                         <div className="spinner"></div>
                         Processing...
                       </>
                     ) : (
                       isBackwardMode ? 'Encrypt to PGP' : 'Transform PII Data'
                     )}
                   </button>
                   <button
                     onClick={clearAll}
                     className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105 focus-ring"
                   >
                     Clear All
                   </button>
                </div>
              </div>

              {/* Output Section */}
               <div className="space-y-4">
                 <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                   Transformed Text
                 </h2>
                 <TransformationResultComponent 
                   result={transformationResult} 
                   onCopy={handleCopyTransformed} 
                 />
               </div>
            </div>

            {/* Info Section */}
             <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg animate-fade-in">
               <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                 Supported PII Types
               </h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-800 dark:text-blue-200">
                  {getAvailablePatterns().map((pattern: any, index: number) => (
                    <div key={index} className="animate-slide-in" style={{ animationDelay: `${index * 0.05}s` }}>• {pattern.description}</div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
