"use client";

import { FolderOpen } from "lucide-react";
import { useRef, useState } from "react";
import { parseFlowerDesignFile } from "@/lib/flower-file";
import { useFlowerStore } from "@/lib/flower-store";

export function FlowerFileLoader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const loadSettings = useFlowerStore((state) => state.loadSettings);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const loadFile = async (file?: File) => {
    if (!file) return;
    setStatus("loading");
    try {
      const design = parseFlowerDesignFile(await file.text());
      loadSettings(design.settings);
      setStatus("idle");
    } catch (error) {
      console.error("Could not load flower design", error);
      setStatus("error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept="application/json,.json"
        aria-label="Load flower JSON file"
        onChange={(event) => void loadFile(event.target.files?.[0])}
      />
      <button
        className="secondary-button"
        disabled={status === "loading"}
        onClick={() => inputRef.current?.click()}
      >
        <FolderOpen size={17} />
        {status === "loading"
          ? "Loading…"
          : status === "error"
            ? "Invalid JSON"
            : "Load JSON"}
      </button>
    </>
  );
}
