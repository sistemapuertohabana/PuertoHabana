#!/bin/bash
# Script para ejecutar migración de tapers en Supabase
# Usa la Management API de Supabase

set -e

# Cargar variables de entorno
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_KEY" ]; then
  echo "Error: SUPABASE_URL o SERVICE_KEY no encontrados"
  exit 1
fi

# Extraer project ref de la URL
PROJECT_REF=$(echo "$SUPABASE_URL" | sed 's|https://||' | sed 's|\.supabase\.co.*||')
echo "Project ref: $PROJECT_REF"

# Leer SQL de migración
MIGRATION_SQL=$(cat db/migrate_tapers.sql)

# Ejecutar via Management API
echo "Ejecutando migración..."
curl -s -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg query "$MIGRATION_SQL" '{query: $query}')" \
  -w "\nHTTP_CODE:%{http_code}"

echo ""
echo "Migración completada. Verifica en el dashboard de Supabase."
