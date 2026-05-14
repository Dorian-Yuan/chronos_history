import { useState, useEffect, useRef } from "react";
import type { SaveData } from "@/types";
import {
  getAllSaves,
  loadFromSlot,
  saveToSlot,
  deleteSlot,
  exportSlotData,
  importSave,
} from "@/lib/game";
import type { GameState } from "@/types";
import {
  Download,
  Upload,
  Trash2,
  X,
  Circle,
  CheckCircle2,
} from "lucide-react";

interface SaveManagerProps {
  mode: "start" | "game";
  gameState: GameState;
  onLoad: (state: GameState) => void;
  onClose: () => void;
}

type PanelMode = "normal" | "export" | "import";

export function SaveManager({
  mode,
  gameState,
  onLoad,
  onClose,
}: SaveManagerProps) {
  const [saves, setSaves] = useState<{ slotIndex: number; data: SaveData }[]>(
    () => getAllSaves(),
  );
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("normal");
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (panelMode !== "normal") {
          setPanelMode("normal");
          setSelectedSlot(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, panelMode]);

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
    setConfirmingDelete(null);
    refreshSaves();
  };

  const handleSlotClick = (slotIndex: number) => {
    if (panelMode === "export") {
      const save = saves.find((s) => s.slotIndex === slotIndex);
      if (save) {
        setSelectedSlot(selectedSlot === slotIndex ? null : slotIndex);
      }
      return;
    }

    if (panelMode === "import") {
      const save = saves.find((s) => s.slotIndex === slotIndex);
      if (!save) {
        setSelectedSlot(selectedSlot === slotIndex ? null : slotIndex);
      }
      return;
    }

    if (mode === "start") {
      const save = saves.find((s) => s.slotIndex === slotIndex);
      if (save) {
        handleLoad(slotIndex);
      }
    } else {
      const save = saves.find((s) => s.slotIndex === slotIndex);
      if (!save) {
        handleSave(slotIndex);
      }
    }
  };

  const handleExportSlot = () => {
    if (selectedSlot === null) return;
    const json = exportSlotData(selectedSlot);
    if (!json) return;

    const save = saves.find((s) => s.slotIndex === selectedSlot);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const title = save?.data.metadata.scenarioTitle?.slice(0, 4) || "save";
    a.download = `chronos_${title}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setPanelMode("normal");
    setSelectedSlot(null);
  };

  const handleImportSlot = () => {
    if (selectedSlot === null) return;
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
        saveToSlot(selectedSlot, data.state);
        refreshSaves();
        setImportError(null);
        setPanelMode("normal");
        setSelectedSlot(null);
      } else {
        setImportError("存档文件格式无效");
      }
    };
    input.click();
  };

  const enterExportMode = () => {
    setPanelMode("export");
    setSelectedSlot(null);
    setImportError(null);
  };

  const enterImportMode = () => {
    setPanelMode("import");
    setSelectedSlot(null);
    setImportError(null);
  };

  const exitSelectionMode = () => {
    setPanelMode("normal");
    setSelectedSlot(null);
    setImportError(null);
  };

  const getSlotClickable = (slotIndex: number): boolean => {
    if (panelMode === "export") {
      return !!saves.find((s) => s.slotIndex === slotIndex);
    }
    if (panelMode === "import") {
      return !saves.find((s) => s.slotIndex === slotIndex);
    }
    if (mode === "start") {
      return !!saves.find((s) => s.slotIndex === slotIndex);
    }
    return !saves.find((s) => s.slotIndex === slotIndex);
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

        <div className="modal-body space-y-3">
          {Array.from({ length: 5 }, (_, i) => {
            const save = saves.find((s) => s.slotIndex === i);
            const clickable = getSlotClickable(i);
            const isConfirmingDelete = confirmingDelete === i;

            if (isConfirmingDelete) {
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-status-error-border bg-status-error-bg px-4 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold font-serif text-text-primary">
                      存档 {i + 1}
                    </div>
                    <div className="text-xs text-accent-danger mt-0.5 font-serif">
                      确认删除此存档？
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setConfirmingDelete(null)}
                      className="btn-ghost px-3 py-1.5 text-xs font-serif"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleDelete(i)}
                      className="rounded-lg bg-accent-danger px-3 py-1.5 text-xs text-white font-serif hover:opacity-90 active:scale-95 transition-all"
                    >
                      删除
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={i}
                onClick={() => clickable && handleSlotClick(i)}
                className={`flex items-center gap-3 rounded-lg border px-4 py-2 ${
                  clickable
                    ? "border-border bg-bg-card cursor-pointer hover:bg-bg-hover active:scale-[0.98] transition-all"
                    : "border-border bg-bg-card"
                } ${
                  selectedSlot === i
                    ? "ring-2 ring-accent-primary border-accent-primary"
                    : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold font-serif text-text-primary">
                    存档 {i + 1}
                  </div>
                  {save ? (
                    <div className="text-xs text-text-tertiary mt-0.5 truncate font-serif">
                      {save.data.metadata.scenarioTitle} ·{" "}
                      {save.data.metadata.nationName} · 第
                      {save.data.metadata.turnCount}回合 ·{" "}
                      {new Date(save.data.metadata.timestamp).toLocaleString()}
                    </div>
                  ) : (
                    <div className="text-xs text-text-tertiary mt-1 font-serif">
                      {mode === "game" && panelMode === "normal"
                        ? "空 点击存档"
                        : "空"}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0 items-center">
                  {panelMode === "export" &&
                    (save ? (
                      selectedSlot === i ? (
                        <CheckCircle2
                          size={18}
                          className="text-accent-primary"
                        />
                      ) : (
                        <Circle size={18} className="text-text-tertiary" />
                      )
                    ) : (
                      <Circle size={18} className="text-bg-tertiary" />
                    ))}
                  {panelMode === "import" &&
                    (!save ? (
                      selectedSlot === i ? (
                        <CheckCircle2
                          size={18}
                          className="text-accent-primary"
                        />
                      ) : (
                        <Circle size={18} className="text-text-tertiary" />
                      )
                    ) : null)}
                  {panelMode === "normal" && save && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmingDelete(i);
                      }}
                      className="btn-ghost p-2 text-accent-danger"
                      aria-label={`删除存档 ${i + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {importError && (
            <div
              role="alert"
              className="rounded-lg border border-status-error-border bg-status-error-bg px-4 py-2.5 text-xs text-status-error-text"
            >
              {importError}
            </div>
          )}
        </div>

        <div className="modal-footer flex">
          {panelMode === "normal" && (
            <>
              <button
                onClick={enterExportMode}
                className="btn-secondary flex-1 font-serif"
              >
                <Download size={13} /> 导出
              </button>
              <button
                onClick={enterImportMode}
                className="btn-secondary flex-1 font-serif"
              >
                <Upload size={13} /> 导入
              </button>
            </>
          )}
          {panelMode === "export" && (
            <>
              <button
                onClick={exitSelectionMode}
                className="btn-secondary flex-1 font-serif"
              >
                取消
              </button>
              <button
                onClick={handleExportSlot}
                disabled={selectedSlot === null}
                className="btn-primary flex-1 font-serif disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download size={13} /> 导出
              </button>
            </>
          )}
          {panelMode === "import" && (
            <>
              <button
                onClick={exitSelectionMode}
                className="btn-secondary flex-1 font-serif"
              >
                取消
              </button>
              <button
                onClick={handleImportSlot}
                disabled={selectedSlot === null}
                className="btn-primary flex-1 font-serif disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Upload size={13} /> 导入
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
