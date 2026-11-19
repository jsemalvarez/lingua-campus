/**
 * Colores de la práctica, con la estética actual del campus (Inter, blanco y el
 * verde #38b397). El gris de `muted-foreground` (#808080) y el verde `primary`
 * no llegan a 4,5:1 sobre blanco con texto chico, así que en claro van un tono
 * más oscuros. En oscuro se usan los del tema, que sí llegan.
 *
 * Lo errado va en naranja y lo elegido, hasta comprobar, en índigo: el rojo y el
 * verde de antes aparecían antes de tiempo (aprobado en el lienzo, 11/11/2026).
 */

export const MUTED = "text-[#6b6b6b] dark:text-muted-foreground";
export const GREEN_TEXT = "text-[#23705b] dark:text-primary";
export const GREEN_TINT = "bg-[#e8f6f2] dark:bg-primary/15";
export const GREEN_BUTTON = "bg-[#2b8069] text-white hover:bg-[#23705b]";
export const ORANGE_TEXT = "text-[#c2410c] dark:text-orange-300";
export const ORANGE_BUTTON = "bg-[#c2410c] text-white hover:bg-[#9a3412]";
export const INDIGO_CHOSEN = "border-2 border-[#2e3192] bg-[#eef0fb] font-bold text-[#2e3192] dark:border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-200";
export const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";
