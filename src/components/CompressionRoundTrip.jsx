import { useEffect, useRef } from "react";
import { AlertTriangle, ArrowLeft, Download, LoaderCircle, RotateCcw } from "lucide-react";

export default function CompressionRoundTrip({ image, result, k, onKChange, onBack }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!result.result || result.status !== "ready") return;
    const canvas = canvasRef.current;
    canvas.width = result.result.columns;
    canvas.height = result.result.rows;
    canvas.getContext("2d").putImageData(
      new ImageData(result.result.pixels, result.result.columns, result.result.rows),
      0,
      0
    );
  }, [result]);

  if (!image) {
    return (
      <div className="lab-card flex min-h-[420px] items-center justify-center text-slate-400">
        Carga una imagen para iniciar la compresión y descompresión.
      </div>
    );
  }

  if (result.status === "loading") {
    return (
      <div className="lab-card flex min-h-[420px] flex-col items-center justify-center gap-3 text-cyan-300">
        <LoaderCircle className="animate-spin" />
        <strong>Comprimiendo y reconstruyendo la imagen...</strong>
        <span className="text-sm text-slate-400">La matriz SVD se está reconstruyendo en segundo plano.</span>
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div className="lab-card flex min-h-[420px] flex-col items-center justify-center gap-3 text-red-200">
        <AlertTriangle />
        <strong>{result.error}</strong>
        <button className="button-secondary" onClick={() => onKChange(1)}>
          <RotateCcw size={16} /> Reintentar
        </button>
      </div>
    );
  }

  const data = result.result;
  const maxK = Math.min(data.rows, data.columns);
  const usesFullRank = data.k === maxK;
  return (
    <div className="lab-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Reversión de la transformación</p>
          <h2>Comprimir y descomprimir</h2>
        </div>
        <button className="button-secondary" onClick={onBack}><ArrowLeft size={16} /> Cambiar modo</button>
      </div>
      <p className="helper-text mb-5">
        La descompresión reconstruye la imagen multiplicando las matrices SVD conservadas.
        Los componentes descartados no pueden recuperarse.
      </p>
      <div className="grid gap-5 md:grid-cols-2">
        <figure>
          <figcaption className="mb-2 text-sm text-slate-400">Imagen original</figcaption>
          <img className="mx-auto max-h-72 rounded-xl object-contain" src={image} alt="Original" />
        </figure>
        <figure>
          <figcaption className="mb-2 text-sm text-slate-400">Imagen descomprimida</figcaption>
          <canvas className="mx-auto max-h-72 max-w-full rounded-xl object-contain" ref={canvasRef} />
        </figure>
      </div>
      <div className="mt-6">
        <div className="mb-2 flex justify-between text-sm">
          <label htmlFor="round-trip-k">Componentes guardados en la matriz SVD</label>
          <strong className="text-cyan-300">{data.k}</strong>
        </div>
        <input id="round-trip-k" className="w-full accent-cyan-400" type="range" min="1" max={maxK} value={data.k} onChange={(event) => onKChange(Number(event.target.value))} />
      </div>
      <div className={`mt-5 rounded-xl border p-4 text-sm ${usesFullRank ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-amber-400/30 bg-amber-400/10 text-amber-100"}`}>
        <strong>{usesFullRank ? "Rango completo: reversión prácticamente exacta" : "Rango truncado: la reversión es aproximada"}</strong>
        <p className="mt-1">
          {usesFullRank
            ? "Se conservaron todos los componentes disponibles. La representación puede recuperar la matriz original, aunque no implica reducción de almacenamiento."
            : "La imagen descomprimida mantiene la información de los primeros componentes, pero no puede recuperar los detalles descartados."}
        </p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <Metric label="Matriz" value={`${data.rows} × ${data.columns}`} />
        <Metric label="MSE" value={data.mse.toFixed(2)} />
        <Metric label="Almacenamiento SVD" value={`${data.compressedSize.toLocaleString()} elem.`} />
        <Metric label="Reducción" value={`${data.compression.toFixed(2)}%`} />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button className="button-secondary" onClick={() => onKChange(maxK)} disabled={usesFullRank}>
          <RotateCcw size={17} /> Revertir con rango completo
        </button>
        <button className="button-primary" onClick={() => canvasRef.current?.toBlob((blob) => {
          if (!blob) return;
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = "imagen_svd_descomprimida.png";
          link.click();
          URL.revokeObjectURL(link.href);
        })}>
          <Download size={18} /> Descargar descomprimida
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="rounded-xl bg-slate-800 p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 font-semibold text-cyan-200">{value}</p></div>;
}
