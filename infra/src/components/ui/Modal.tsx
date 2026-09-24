import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input:not([type="hidden"]), select, [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Título do diálogo (h2 serif); também virou o aria-labelledby padrão. */
  title: ReactNode;
  /** Sobrescreve o id do título (use quando o título precisar ser referenciado). */
  titleId?: string;
  /** Linha de apoio abaixo do título (opcional). */
  subtitle?: ReactNode;
  /** Texto acessível quando não houver título visível. */
  ariaLabel?: string;
  /** md = max-w-xl (padrão), lg = max-w-2xl. */
  size?: "md" | "lg";
  children: ReactNode;
  /** true quando há preenchimento não salvo: fechar pede confirmação antes de descartar. */
  isDirty?: boolean;
  /** Mensagem exibida ao confirmar descarte (usada junto de isDirty). */
  confirmDiscardMessage?: string;
  closeLabel?: string;
}

/**
 * Modal base do design system.
 *
 * Acessibilidade e controle embutidos (auditoria UX — H3):
 * - Fecha com Escape e clique no backdrop (ambos passam pela guarda de descarte);
 * - Focus trap com Tab/Shift+Tab dentro do painel;
 * - Devolve o foco ao elemento que abriu o modal;
 * - Oculta o app de leitores de tela e de interação (aria-hidden + inert no #root)
 *   enquanto o diálogo está aberto — o modal é renderizado via portal no body;
 * - Bloqueia o scroll do body;
 * - `isDirty` + `confirmDiscardMessage` evitam perda acidental de dados.
 */
export function Modal({
  open,
  onClose,
  title,
  titleId,
  subtitle,
  ariaLabel,
  size = "md",
  children,
  isDirty = false,
  confirmDiscardMessage,
  closeLabel = "Fechar",
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const generatedTitleId = useId();
  const headingId = titleId ?? generatedTitleId;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const requestClose = useCallback(() => {
    if (isDirty && confirmDiscardMessage && !window.confirm(confirmDiscardMessage)) {
      return;
    }
    onCloseRef.current();
  }, [isDirty, confirmDiscardMessage]);

  // Escape, bloqueio de scroll, foco e ocultamento do conteúdo de fundo.
  useEffect(() => {
    if (!open) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const appRoot = document.getElementById("root");

    if (appRoot) {
      appRoot.setAttribute("aria-hidden", "true");
      appRoot.inert = true;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        requestClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Foco inicial síncrono: evita corrida com interações imediatas
    // (ex.: digitação logo após abrir). Se o conteúdo já trouxer um
    // elemento com autofoco, respeitamos e não roubamos o foco.
    if (document.activeElement === document.body) {
      panelRef.current?.focus();
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (appRoot) {
        appRoot.removeAttribute("aria-hidden");
        appRoot.inert = false;
      }
      previouslyFocused?.focus();
    };
  }, [open, requestClose]);

  // Prende o foco (Tab / Shift+Tab) dentro do painel.
  const handleTabKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;

    const items = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).filter((element) => !element.hasAttribute("disabled"));
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) {
      event.preventDefault();
      return;
    }

    const active = document.activeElement;
    const insidePanel = active instanceof HTMLElement && panel.contains(active);
    if (!insidePanel) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
      return;
    }
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }
    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleBackdropMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) requestClose();
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? headingId : undefined}
        aria-label={title ? undefined : ariaLabel}
        tabIndex={-1}
        onKeyDown={handleTabKey}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-lg border border-border bg-card p-6 shadow-lg focus:outline-none ${
          size === "lg" ? "max-w-2xl" : "max-w-xl"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title ? (
              <h2 id={headingId} className="font-serif text-xl font-bold text-foreground">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label={closeLabel}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body,
  );
}
