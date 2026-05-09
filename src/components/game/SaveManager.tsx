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
import { Download, Upload, Trash2, Save, X } from "lucide-react";

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
      className="modal-overlay animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={modalRef} className="modal-content max-w-md">
        <div className="modal-header">
          <h2 className="font-serif text-lg font-semibold text-text-primary">
            存档管理
          </h2>
          <button
            onClick={onClose}
            className="touch-target flex items-center justify-center rounded-lg p-2 text-text-tertiary hover:bg-bg-hover hover:text-text-primary active:scale-95 transition-all"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body space-y-4">
          {Array.from({ length: 5 }, (_, i) => {
            const save = saves.find((s) => s.slotIndex === i);
            return (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border bg-bg-card px-5 py-5"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary">
                    存档 {i + 1}
                  </div>
                  {save ? (
                    <div className="text-xs text-text-tertiary mt-1 truncate">
                      {save.data.metadata.scenarioTitle} ·{" "}
                      {save.data.metadata.nationName} · 第
                      {save.data.metadata.turnCount}回合 ·{" "}
                      {new Date(save.data.metadata.timestamp).toLocaleString()}
                    </div>
                  ) : (
                    <div className="text-xs text-text-tertiary mt-1">空</div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleSave(i)}
                    className="btn-ghost p-2"
                    aria-label={`保存到存档 ${i + 1}`}
                  >
                    <Save size={14} />
                  </button>
                  {save && (
                    <>
                      <button
                        onClick={() => handleLoad(i)}
                        className="btn-ghost p-2 text-accent-primary"
                        aria-label={`读取存档 ${i + 1}`}
                      >
                        <Upload size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(i)}
                        className="btn-ghost p-2 text-accent-danger"
                        aria-label={`删除存档 ${i + 1}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {importError && (
            <div
              role="alert"
              className="rounded-lg border border-red-900/30 bg-red-900/10 px-4 py-2.5 text-xs text-red-400"
            >
              {importError}
            </div>
          )}
        </div>

        <div className="modal-footer flex gap-2.5">
          <button onClick={handleExport} className="btn-secondary flex-1">
            <Download size={13} /> 导出
          </button>
          <button onClick={handleImport} className="btn-secondary flex-1">
            <Upload size={13} /> 导入
          </button>
        </div>
      </div>
    </div>
  );
}
