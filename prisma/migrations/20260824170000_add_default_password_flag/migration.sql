-- FEAT-11 métrica 6 / SEC-06: si la cuenta conserva la contraseña que le dio el
-- sistema.
--
-- Nace en NULL a propósito, y NULL no es "no": es "todavía no se revisó". La
-- respuesta exige un bcrypt.compare por candidato porque el hash lleva salt
-- aleatoria, así que no se puede resolver acá adentro. La llena una pasada por
-- lotes desde el panel de uso, y de ahí en adelante la sostienen las escrituras
-- de contraseña, que ya saben cuál están escribiendo.
--
-- Sin default: si fuera `DEFAULT false`, una cuenta creada por un camino que nos
-- olvidemos de tocar diría "no tiene la contraseña por defecto" sin que nadie lo
-- haya verificado, que es la peor de las tres respuestas posibles.

ALTER TABLE "User" ADD COLUMN "hasDefaultPassword" BOOLEAN;
ALTER TABLE "Student" ADD COLUMN "hasDefaultPassword" BOOLEAN;
