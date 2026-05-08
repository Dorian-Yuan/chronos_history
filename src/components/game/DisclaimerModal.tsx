import { useState, useEffect, useRef } from "react";

const DISCLAIMER_KEY = "chronos_disclaimer_accepted";

export function DisclaimerModal() {
  const [visible, setVisible] = useState(
    () => !localStorage.getItem(DISCLAIMER_KEY),
  );
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && modalRef.current) {
      const firstButton = modalRef.current.querySelector("button");
      firstButton?.focus();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6"
      >
        <h2
          id="disclaimer-title"
          className="mb-4 text-lg font-serif font-bold text-zinc-100"
        >
          免责声明
        </h2>
        <div className="space-y-3 text-sm text-zinc-300 leading-relaxed">
          <p>
            本游戏为虚构的历史决策推演模拟，所有剧情、人物、国家均为AI生成，不代表任何真实观点或立场。
          </p>
          <p>
            游戏中可能出现的历史事件参考仅用于娱乐目的，不构成对任何历史事件、政治立场或领土争议的表态。
          </p>
          <p>
            游戏内容可能涉及战争、政治冲突等敏感主题，请理性对待。如有不适，请停止游戏。
          </p>
          <p>本游戏禁止用于任何政治宣传或违法行为。</p>
        </div>
        <button
          onClick={() => {
            localStorage.setItem(DISCLAIMER_KEY, "true");
            setVisible(false);
          }}
          className="mt-6 w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-500 transition-colors"
          autoFocus
        >
          我已了解，进入游戏
        </button>
      </div>
    </div>
  );
}
