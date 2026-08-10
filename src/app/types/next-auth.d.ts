import { DefaultSession } from "next-auth";

/**
 * Campos propios que Lingua Campus agrega a la sesión y al token.
 *
 * Todos opcionales a propósito: el JWT se emite al iniciar sesión y dura 30 días,
 * así que un token viejo puede no traer los campos agregados después. Tiparlos como
 * obligatorios daría una garantía que en runtime no existe (ver SEC-08).
 *
 * `birthDate` viaja dentro del JWT, que se serializa a JSON: es `Date` en el
 * primer request y `string` en los siguientes. Se tipa así para que el código
 * que la consume no asuma un `Date` que puede no serlo.
 */
type LinguaSessionFields = {
    id?: string;
    roles?: string[];
    /** `null` para SUPERADMIN, que no pertenece a ningún instituto. */
    instituteId?: string | null;
    birthDate?: string | Date | null;
};

declare module "next-auth" {
  interface Session {
    user: LinguaSessionFields & DefaultSession["user"];
  }

  /** Lo que devuelve `authorize()` en el provider de credenciales. */
  interface User extends LinguaSessionFields {}
}

declare module "next-auth/jwt" {
  interface JWT extends LinguaSessionFields {}
}
