import { useState, useEffect, useRef } from "react";
import type { SaveData } from "@/types";
import {
  getAllSaves,
  loadFromSlot,
  saveToSlot,
  deleteSlot,
  exportSave,
  importSave,
} from "@/lib/game";
import type { GameState } from "@/types";
import { Download, Upload, Trash2, Save } from "lucide-react";

interface SaveManagerProps {
  gameState: GameState;
  onLoad: (state: GameState) => void;
  onClose: () => void;
}

export function SaveManager({ gameState, onLoad, onClose }: SaveManagerProps) {
  const [saves, setSaves] = useState<{ slotIndex: number; data: SaveData }[]>(
    () => getAllSaves(),
  );
  const [importError, setImportError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (modalRef.current) {
      const firstFocusable =
        modalRef.current.querySelector<HTMLElement>("button, [tabindex]");
      firstFocusable?.focus();
    }
  }, []);

  const refreshSaves = () => setSaves(getAllSaves());

  const handleSave = (slotIndex: number) => {
    saveToSlot(slotIndex, gameState);
    refreshSaves();
  };

  const handleLoad = (slotIndex: number) => {
    const data = loadFromSlot(slotIndex);
    if (data) {
      onLoad(data.state);
      onClose();
    }
  };

  const handleDelete = (slotIndex: number) => {
    deleteSlot(slotIndex);
    refreshSaves();
  };

  const handleExport = () => {
    const json = exportSave(gameState);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chronos_save_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.setAttribute("aria-label", "选择存档文件");
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const data = importSave(text);
      if (data) {
        onLoad(data.state);
        onClose();
      } else {
        setImportError("存档文件格式无效");
      }
    };
    input.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-manager-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="save-manager-title"
            className="text-lg font-serif font-bold text-zinc-100"
          >
            存档管理
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <ul className="space-y-2 mb-4">
          {Array.from({ length: 5 }, (_, i) => {
            const save = saves.find((s) => s.slotIndex === i);
            return (
              <li
                key={i}
                className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/50 p-3"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-300">
                    存档 {i + 1}
                  </div>
                  {save ? (
                    <div className="text-xs text-zinc-400">
                      {save.data.metadata.scenarioTitle} ·{" "}
                      {save.data.metadata.nationName} · 第
                      {save.data.metadata.turnCount}回合 ·{" "}
                      {new Date(save.data.metadata.timestamp).toLocaleString()}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500">空</div>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleSave(i)}
                    className="rounded p-2 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                    aria-label={`保存到存档 ${i + 1}`}
                  >
                    <Save size={14} />
                  </button>
                  {save && (
                    <>
                      <button
                        onClick={() => handleLoad(i)}
                        className="rounded p-2 text-zinc-400 hover:bg-zinc-700 hover:text-amber-400"
                        aria-label={`读取存档 ${i + 1}`}
                      >
                        <Upload size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(i)}
                        className="rounded p-2 text-zinc-400 hover:bg-zinc-700 hover:text-red-400"
                        aria-label={`删除存档 ${i + 1}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {importError && (
          <div
            role="alert"
            className="mb-3 rounded-lg border border-red-900/30 bg-red-900/10 px-3 py-2 text-xs text-red-400"
          >
            {importError}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            <Download size={12} /> 导出存档
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            <Upload size={12} /> 导入存档
          </button>
        </div>
      </div>
    </div>
  );
}
