-- FIN-33: la cuota que tuvo pagos y se los anularon todos ya no se borra, se anula.
-- Aditiva: un valor más en el enum, sin tocar filas existentes.
ALTER TYPE "PaymentStatus" ADD VALUE 'CANCELLED';
