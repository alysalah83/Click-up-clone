"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false },
);

function Whiteboard() {
  const { theme } = useTheme();
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  useEffect(() => {
    if (excalidrawAPI) {
      excalidrawAPI.updateScene({
        appState: {
          theme: theme === "dark" ? "dark" : "light",
          collaborators: new Map(),
        },
      });
    }
  }, [theme, excalidrawAPI]);

  const handleChange = (elements: any, appState: any) => {
    const data = JSON.stringify({
      elements,
      appState: {
        theme: appState.theme,
        viewBackgroundColor: appState.viewBackgroundColor,
      },
    });
    localStorage.setItem("whiteboard-data", data);
  };

  const getSavedData = () => {
    if (typeof window === "undefined") return undefined;
    const saved = localStorage.getItem("whiteboard-data");
    if (!saved) return undefined;
    try {
      const parsed = JSON.parse(saved);
      return {
        elements: parsed.elements,
        appState: {
          ...parsed.appState,
          collaborators: new Map(),
          theme: theme === "dark" ? "dark" : "light",
        },
      };
    } catch {
      return undefined;
    }
  };

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <Excalidraw
        excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
        initialData={
          getSavedData() ?? {
            elements: [],
            appState: {
              theme: theme === "dark" ? "dark" : "light",
              collaborators: new Map(),
            },
          }
        }
        onChange={handleChange}
      />
    </div>
  );
}

export default Whiteboard;
