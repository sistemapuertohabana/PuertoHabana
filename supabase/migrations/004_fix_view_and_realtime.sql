-- Fix SECURITY DEFINER issue for the view
DROP VIEW IF EXISTS pedidos_vista;

CREATE VIEW pedidos_vista WITH (security_invoker = true) AS
SELECT
  ci.id,
  ci.nombre AS item,
  ci.cantidad,
  m.numero AS mesa,
  ci.precio,
  ci.estado::text AS estado,
  TO_CHAR(c.hora_apertura, 'HH24:MI') AS hora,
  c.fecha::text AS fecha,
  c.mozo_id AS mozo_id,
  p.nombre AS mozo_nombre,
  COALESCE(ci.categoria::text, 'comida') AS category,
  ci.notas,
  ci.comanda_id,
  c.mesa_id,
  c.estado AS comanda_estado
FROM comanda_items ci
JOIN comandas c ON c.id = ci.comanda_id
JOIN mesas m ON m.id = c.mesa_id
JOIN profiles p ON p.id = c.mozo_id;

-- Ensure profiles is added to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
