import { Bricolage_Grotesque, DM_Sans } from "next/font/google";

// Las dos fuentes de la dirección Cálida. Se cargan solo en la landing y llegan como
// variables CSS: `font-display` y `font-body` las leen (ver `globals.css`).
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-bricolage",
  display: "swap",
});

export const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});
