"use client";

import * as React from "react";
import { createPortal } from "react-dom";

/**
 * Cuelga a sus hijos de `document.body`, fuera del árbol donde se escribieron.
 *
 * Es lo que necesita cualquier capa `fixed inset-0` que pretenda cubrir la
 * ventana: un ancestro con `transform` distinto de `none` pasa a ser el bloque
 * contenedor de los `fixed` que tenga adentro, y la capa se mide contra ese
 * ancestro y no contra la ventana. Acá pasa en casi todas las pantallas, porque
 * el `<main>` lleva `animate-in`, esa animación corre con
 * `animation-fill-mode: both` y al terminar deja aplicado un `transform`
 * identidad —que no mueve nada, pero alcanza—. El síntoma es un cartel de
 * confirmación centrado en la página en vez de en la pantalla: si el operador
 * está scrolleado, no lo ve. Ver BUG-24.
 *
 * El `mounted` es por el render del servidor, donde no existe `document`: el
 * primer render devuelve `null` y el portal se arma recién en el cliente. Es el
 * mismo patrón que ya usaba `DialogContent`, que por eso no necesita este
 * componente.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}
