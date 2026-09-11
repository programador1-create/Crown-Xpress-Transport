# Migración a IONOS PostgreSQL

## Resumen

La base de datos de la aplicación se migró de Neon (PostgreSQL 18 serverless) a IONOS VPS (PostgreSQL 16 en Docker). El SQL Server NBCW permanece on-premise y no se migra.

## Estado Actual

| Componente | Estado |
|---|---|
| PostgreSQL 16 en Docker (IONOS) | Activo y healthy |
| Caddy con layer4 (TLS proxy) | Activo en puerto 443 |
| Certificado Let's Encrypt | `db.crown-xpress-transport.app` |
| Migración de datos Neon → IONOS | Completa (509 inspections, 668 TPR, 26 employees) |
| Sync script NBCW → IONOS | Activo en PC on-premise |
| Vercel `DATABASE_URL` | Apuntando a IONOS |
| Driver `pg` (node-postgres) | Reemplaza `@neondatabase/serverless` |
| CRM existente en IONOS | Sin cambios, funcionando |

## Infraestructura IONOS

### VPS

- **IP:** 74.208.37.187
- **OS:** Ubuntu 24.04.5 LTS
- **Recursos:** 8 CPU, 15 GiB RAM, 464 GiB disco
- **Docker:** 29.8.0
- **Docker Compose:** v5.5.1

### PostgreSQL (Crown-Xpress)

```yaml
# /opt/crown-postgres/docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    container_name: crown-postgres
    restart: unless-stopped
    env_file: .env
    ports:
      - "127.0.0.1:5433:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d
      - ./tls:/etc/postgresql/tls:ro
    command: >
      postgres
        -c ssl=on
        -c ssl_cert_file=/etc/postgresql/tls/server.crt
        -c ssl_key_file=/etc/postgresql/tls/server.key
        -c listen_addresses=*
        -c max_connections=50
        -c shared_buffers=256MB
        -c effective_cache_size=512MB
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U crown -d crownxpress"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - crown-network
```

### Caddy con layer4

Caddy se compiló con `xcaddy` incluyendo el módulo `layer4` para soportar proxy TCP de PostgreSQL.

```bash
xcaddy build --with github.com/mholt/caddy-l4@latest --output /usr/local/bin/caddy-l4
```

### Caddyfile

```caddyfile
{
    auto_https disable_redirects
    email programador1@transporteslga.com

    servers {
        listener_wrappers {
            layer4 {
                @pg postgres
                route @pg {
                    postgres_tls
                    tls
                    proxy 127.0.0.1:5433
                }
            }
            tls
        }
    }
}

api.crown-xpress-transport.app {
    reverse_proxy localhost:80
}

auth.crown-xpress-transport.app {
    reverse_proxy localhost:80
}

db.crown-xpress-transport.app {
    respond "Crown PostgreSQL OK" 200
}

evenchess.jmbj2457.com {
    reverse_proxy 100.64.194.71:3000
}
```

### Conexión

```
postgresql://crown:<password>@db.crown-xpress-transport.app:443/crownxpress?sslmode=require
```

- **Puerto 443** — PostgreSQL y HTTP comparten el puerto (SNI routing)
- **TLS** — Terminado por Caddy con certificado Let's Encrypt
- **Proxy** — Caddy → 127.0.0.1:5433 → PostgreSQL container

## CRM Existente (NO TOCAR)

Contenedores que estaban corriendo antes de la migración y no se modificaron:

- crm-backend
- crm-nginx-proxy
- crm-authentik-server
- crm-authentik-worker
- crm-authentik-postgres
- crm-carbone
- crm-dogwatch
- crm-sqlserver

## Pasos de la Migración (Ya Completados)

1. **Auditoría IONOS** — Verificar recursos sin tocar CRM
2. **Despliegue PostgreSQL** — Docker container aislado en red `crown-network`
3. **TLS** — Certificado/key montados, permisos `0600` en `server.key`
4. **Dump Neon** — `pg_dump` con PostgreSQL 18 (formato custom, 161 MB)
5. **Restore IONOS** — `pg_restore` con PostgreSQL 18
6. **Verificación** — Counts, vistas, constraints, secuencias
7. **Caddy layer4** — Build con xcaddy, Caddyfile con `postgres_tls`
8. **DNS** — `db.crown-xpress-transport.app` → 74.208.37.187
9. **Certificado TLS** — Let's Encrypt automático
10. **Driver** — Cambio de `@neondatabase/serverless` a `pg`
11. **Sync script** — Actualizado para escribir a IONOS
12. **Vercel** — `DATABASE_URL` actualizado

## Rollback a Neon

Si se necesita regresar a Neon:

1. En Vercel → Settings → Environment Variables → `DATABASE_URL`
2. Cambiar a: `postgresql://neondb_owner:npg_hg6eq0tnsrpK@ep-shiny-grass-aq5qzmg9-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require`
3. Redeploy

El sync script también puede apuntar a Neon cambiando `DATABASE_URL` en `scripts/.env`.

## Pendiente

- **Rotar password** — La password de PostgreSQL apareció en output; rotar antes de producción
- **Backups automáticos** — Configurar `pg_dump` cron en IONOS
- **Monitoreo** — Alertas de health del contenedor
