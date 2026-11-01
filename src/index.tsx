"use client";
/**
 * React bindings for public/embed.js. SSR-safe: nothing touches `window` during render; the script loads once on demand.
 * Types for the underlying SDK live in ../embed/types.d.ts.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import type { EmbedMode, EmbedOptions, EmbedWidget } from "./embed-types";

type Common = Omit<EmbedOptions, "mode">;
export type FormFlowEmbedProps = Common & {
  /** Form slug (the part after /f/). */
  slug: string;
  /** Instance origin, e.g. https://forms.example.com. Defaults to NEXT_PUBLIC_FORMFLOW_URL, then the page origin. */
  baseUrl?: string;
  mode?: EmbedMode;
  className?: string;
  style?: CSSProperties;
};

const scriptPromises = new Map<string, Promise<void>>();

/** Loads `<baseUrl>/embed.js` once (auto-init disabled; React owns the widgets). Resolves immediately if already present. */
export function loadFormFlowScript(baseUrl: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.FormFlow) return Promise.resolve();
  let p = scriptPromises.get(baseUrl);
  if (!p) {
    p = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `${baseUrl.replace(/\/$/, "")}/embed.js`;
      s.async = true;
      s.setAttribute("data-auto-init", "false");
      s.onload = () => resolve();
      s.onerror = () => { scriptPromises.delete(baseUrl); reject(new Error("FormFlow: could not load embed.js")); };
      document.head.appendChild(s);
    });
    scriptPromises.set(baseUrl, p);
  }
  return p;
}

const defaultBase = () => (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_FORMFLOW_URL : undefined) ?? (typeof window !== "undefined" ? window.location.origin : "");

export function FormFlowEmbed({ slug, baseUrl, mode = "inline", className, style, ...opts }: FormFlowEmbedProps) {
  const host = useRef<HTMLDivElement>(null);
  const cb = useRef(opts);
  cb.current = opts; // always call the latest callbacks without rebuilding the widget
  const base = baseUrl ?? defaultBase();
  const { onReady: _a, onSubmit: _b, onProgress: _c, onError: _d, onClose: _e, ...structuralOpts } = opts;
  const structural = JSON.stringify(structuralOpts);

  useEffect(() => {
    let widget: EmbedWidget | undefined;
    let cancelled = false;
    const el = host.current;
    if (!el) return;
    loadFormFlowScript(base).then(() => {
      if (cancelled || !window.FormFlow) return;
      widget = window.FormFlow.createWidget(el, slug, {
        ...cb.current, mode, baseUrl: base,
        onReady: (d) => cb.current.onReady?.(d),
        onSubmit: (d) => cb.current.onSubmit?.(d),
        onProgress: (d) => cb.current.onProgress?.(d),
        onError: (d) => cb.current.onError?.(d),
        onClose: () => cb.current.onClose?.(),
      });
    }).catch((e: unknown) => cb.current.onError?.({ message: e instanceof Error ? e.message : "load failed" }));
    return () => { cancelled = true; widget?.destroy(); };
  }, [slug, mode, base, structural]);

  return <div ref={host} className={className} style={style} data-formflow-react="" />;
}

/** Imperative control for popups: `const { open, close, ready } = useFormFlow()`. */
export function useFormFlow(o: { baseUrl?: string } = {}) {
  const base = o.baseUrl ?? defaultBase();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    loadFormFlowScript(base).then(() => { if (alive) setReady(true); }).catch(() => undefined);
    return () => { alive = false; };
  }, [base]);
  const open = useCallback((slug: string, opts: EmbedOptions = {}) => {
    if (!window.FormFlow) throw new Error("FormFlow embed script is not loaded yet; check `ready`");
    return window.FormFlow.open(slug, { baseUrl: base, ...opts });
  }, [base]);
  const close = useCallback(() => window.FormFlow?.close(), []);
  return useMemo(() => ({ open, close, ready }), [open, close, ready]);
}

export type FormFlowPopupButtonProps = Common & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onError" | "title"> & {
  slug: string; baseUrl?: string; mode?: Exclude<EmbedMode, "inline">; children?: ReactNode;
};

/** A normal <button> (style it yourself) that opens the form as a popup, slider, modal... */
export function FormFlowPopupButton(props: FormFlowPopupButtonProps) {
  const { slug, baseUrl, mode = "popup", children, onClick, prefill, hidden, styles, title, passQueryParams, transitiveSearchParams, autoClose, prefillFromUrl, prefillFromDataLayer, autoResize, onReady, onSubmit, onProgress, onError, onClose, buttonText: _bt, launcher: _l, trigger: _t, ...rest } = props;
  const ff = useFormFlow({ baseUrl });
  return (
    <button type="button" {...rest} aria-haspopup="dialog" disabled={rest.disabled || !ff.ready}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) ff.open(slug, { mode, prefill, hidden, styles, title, passQueryParams, transitiveSearchParams, autoClose, prefillFromUrl, prefillFromDataLayer, autoResize, onReady, onSubmit, onProgress, onError, onClose });
      }}>
      {children ?? "Open form"}
    </button>
  );
}

export type { EmbedMode, EmbedOptions, EmbedWidget };
