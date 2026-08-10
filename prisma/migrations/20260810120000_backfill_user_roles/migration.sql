-- SEC-01 · Reconciliar `User.roles[]` antes de borrar la columna `role`.
--
-- El sistema arrancó con un rol único (`role`) y después pasó a multi-rol
-- (`roles[]`), pero la migración quedó a medias: la interfaz lee `roles[]` y la
-- autorización seguía leyendo `role`. Como el schema define
-- `role UserRole @default(ADMIN)`, todo usuario creado sin setear `role`
-- explícitamente — los tutores, entre otros — quedó con `role = 'ADMIN'`.
--
-- `roles[]` es la fuente de verdad: es lo que la aplicación mantiene al día al
-- agregar y quitar roles. Esta migración sólo cubre el caso inverso, un usuario
-- viejo que tenga `role` pero no `roles[]`. En la base de stage al 2026-08-10 no
-- había ninguno (17 usuarios, todos con `roles[]` cargado), pero se deja escrito
-- porque producción es otra base.
--
-- Deliberadamente NO se copia `role` sobre un `roles[]` ya cargado: eso le
-- devolvería el rol de profesor a quien fue dado de baja con `roles: { set: [] }`,
-- que es justamente el desfasaje que estamos cerrando.

UPDATE "User"
SET "roles" = ARRAY["role"]::"UserRole"[]
WHERE cardinality("roles") = 0;
