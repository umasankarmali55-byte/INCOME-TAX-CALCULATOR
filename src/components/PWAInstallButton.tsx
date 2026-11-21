import React, {useState} from 'react';
import {Download, Share, X} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-indigo-500 hover:to-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3
                  id="pwa-install-title"
                  className="text-base font-bold text-slate-900 dark:text-slate-100"
                >
                  {isIOS ? 'Install on iPhone / iPad' : 'Install GovtTax India PWA'}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Run offline from your home screen or desktop with instant access to all 5 tax sheets.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Close install instructions"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-4 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono-num font-bold text-blue-700 dark:text-blue-400">1.</span>
                  <span>
                    Tap the <strong className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-white"><Share className="h-3.5 w-3.5" /> Share</strong> button in Safari&apos;s toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono-num font-bold text-blue-700 dark:text-blue-400">2.</span>
                  <span>
                    Scroll down and select <strong className="font-semibold text-slate-900 dark:text-white">Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono-num font-bold text-blue-700 dark:text-blue-400">3.</span>
                  <span>
                    Tap <strong className="font-semibold text-slate-900 dark:text-white">Add</strong> to launch GovtTax as a standalone offline app.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="mt-4 space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono-num font-bold text-blue-700 dark:text-blue-400">1.</span>
                  <span>
                    Open this app in its own browser tab on Chrome, Edge, or Android.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono-num font-bold text-blue-700 dark:text-blue-400">2.</span>
                  <span>
                    Click the <strong className="font-semibold text-slate-900 dark:text-white">Install</strong> icon in the address bar (or open the browser menu and select <strong className="font-semibold text-slate-900 dark:text-white">Install app</strong>).
                  </span>
                </li>
              </ol>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
