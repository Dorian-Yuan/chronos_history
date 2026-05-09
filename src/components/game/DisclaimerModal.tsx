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
    <div className="modal-overlay animate-fade-in">
      <div ref={modalRef} className="modal-content max-w-md">
        <div className="modal-header">
          <h2 className="font-serif text-lg font-semibold text-text-primary">
            免责声明
          </h2>
        </div>

        <div className="modal-body space-y-4 text-sm text-text-secondary leading-relaxed">
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

        <div className="modal-footer">
          <button
            onClick={() => {
              localStorage.setItem(DISCLAIMER_KEY, "true");
              setVisible(false);
            }}
            className="btn-primary w-full max-w-[15rem] mx-auto"
            autoFocus
          >
            我已了解，进入游戏
          </button>
        </div>
      </div>
    </div>
  );
}
