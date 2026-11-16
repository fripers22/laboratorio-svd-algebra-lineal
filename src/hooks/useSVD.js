import { useEffect, useState } from "react";

const MAX_SIZE = 160;

export default function useSVD(source, k) {
  const [state, setState] = useState({ status: "idle", result: null, error: null });
  useEffect(() => {
    if (!source) {
      setState({ status: "idle", result: null, error: null });
      return undefined;
    }
    let cancelled = false;
    const worker = new Worker(new URL("../workers/svd.worker.js", import.meta.url), { type: "module" });
    setState({ status: "loading", result: null, error: null });
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, MAX_SIZE / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const maxK = Math.min(canvas.width, canvas.height);
      const safeK = Math.max(1, Math.min(k, maxK));
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      worker.postMessage({ width: canvas.width, height: canvas.height, k: safeK, pixels: pixels.buffer }, [pixels.buffer]);
    };
    image.onerror = () => !cancelled && setState({ status: "error", result: null, error: "No se pudo decodificar la imagen." });
    worker.onmessage = ({ data }) => {
      if (cancelled) return;
      if (data.type === "error") {
        setState({ status: "error", result: null, error: data.message });
        return;
      }
      setState({
        status: "ready",
        result: { ...data.result, pixels: new Uint8ClampedArray(data.result.pixels), source },
        error: null
      });
    };
    worker.onerror = () => !cancelled && setState({ status: "error", result: null, error: "La SVD no pudo completarse." });
    image.src = source;
    return () => { cancelled = true; worker.terminate(); };
  }, [source, k]);
  return state;
}
