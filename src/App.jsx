import { useEffect, useRef, useState } from "react";
import { BookOpen, FlaskConical, History, Info } from "lucide-react";
import ImageUploader from "./components/ImageUploader";
import SVDVisualizer from "./components/SVDVisualizer";
import EducationalPanel from "./components/EducationalPanel";
import HistoryPanel from "./components/HistoryPanel";
import useSVD from "./hooks/useSVD";

const HISTORY_KEY = "svd-lab-history-v1";

export default function App() {
  const [image, setImage] = useState(null);
  const [fileName, setFileName] = useState("");
  const [step, setStep] = useState(0);
  const [k, setK] = useState(1);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
  });
  const result = useSVD(image, k);
  const savedKey = useRef("");

  useEffect(() => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (error) { console.warn("No se pudo persistir el historial.", error); }
  }, [history]);

  useEffect(() => {
    if (result.status !== "ready" || !result.result) return;
    const data = result.result;
    const key = `${data.source}-${data.k}`;
    if (savedKey.current === key) return;
    savedKey.current = key;
    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = data.columns;
    previewCanvas.height = data.rows;
    previewCanvas.getContext("2d").putImageData(new ImageData(data.pixels, data.columns, data.rows), 0, 0);
    const entry = {
      id: `${Date.now()}-${data.k}`,
      name: fileName || "Ejercicio sin nombre",
      source: data.source,
      preview: previewCanvas.toDataURL("image/jpeg", 0.72),
      createdAt: new Date().toISOString(),
      k: data.k,
      rows: data.rows,
      columns: data.columns,
      compression: data.compression,
      mse: data.mse
    };
    setHistory((previous) => [entry, ...previous.filter((item) => `${item.source}-${item.k}` !== key)].slice(0, 12));
  }, [result, fileName]);

  function handleImage(nextImage, nextName) {
    setImage(nextImage);
    setFileName(nextName);
    setK(1);
    setStep(0);
    savedKey.current = "";
  }

  function selectHistory(item) {
    setImage(item.source);
    setFileName(item.name);
    setK(item.k);
    setStep(2);
    savedKey.current = `${item.source}-${item.k}`;
  }

  return (
    <main className="min-h-screen bg-[#07111f] text-slate-100">
      <header className="topbar">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-400/15 p-2 text-cyan-300"><FlaskConical /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">Álgebra Lineal · UTS</p>
            <h1 className="text-2xl font-bold">Laboratorio SVD</h1>
          </div>
          </div>
          <span className="hidden items-center gap-2 text-xs text-slate-400 md:flex"><Info size={15} /> Explora, ajusta y compara</span>
        </div>
      </header>
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <section className="hero-strip"><div><p className="eyebrow">Cuaderno de experimentación</p><h2>Comprende qué información conserva una imagen</h2><p>Ajusta el rango de la SVD y observa cómo cambia la reconstrucción.</p></div><div className="hero-stat"><History size={22} /><span>{history.length}<small>ejercicios guardados</small></span></div></section>
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-5">
          <ImageUploader onImageLoaded={handleImage} hasImage={Boolean(image)} />
          <SVDVisualizer image={image} result={result} k={k} onKChange={setK} />
        </section>
        <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-5 flex items-center gap-2 text-cyan-300">
            <BookOpen size={20} />
            <h2 className="font-semibold">Motor didáctico</h2>
          </div>
          <EducationalPanel step={step} onStepChange={setStep} image={image} result={result} />
        </aside>
        </div>
        <HistoryPanel items={history} onSelect={selectHistory} onClear={() => setHistory([])} />
      </div>
    </main>
  );
}
