# Caddy + layer4 (IONOS VPS)

## Resumen

Caddy actúa como reverse proxy HTTP y proxy TCP/TLS para PostgreSQL en el VPS de IONOS. Se compiló con el módulo `layer4` para soportar proxy TCP de PostgreSQL sobre el puerto 443.

## Binario

```bash
# Compilado con xcaddy
xcaddy build --with github.com/mholt/caddy-l4@latest --output /usr/local/bin/caddy-l4

# Instalado como /usr/bin/caddy (reemplaza el estándar)
# Servicio: systemctl (caddy.service)
```

## Caddyfile

**Ubicación en VPS:** `/etc/caddy/Caddyfile`
**Ubicación en repo:** `scripts/Caddyfile-ionos`

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

## Cómo Funciona

### Puerto 443 (compartido HTTP + PostgreSQL)

Caddy usa `listener_wrappers` con `layer4` para detectar el protocolo:

1. **PostgreSQL** — Si la conexión comienza con `SSLRequest` (8 bytes), Caddy hace:
   - `postgres_tls` — Lee el SSLRequest, responde 'S'
   - `tls` — Termina TLS con certificado Let's Encrypt
   - `proxy` — Reenvía tráfico descifrado a `127.0.0.1:5433`

2. **HTTPS** — Si la conexión es TLS normal (ClientHello), Caddy hace:
   - `tls` (listener_wrapper) — Termina TLS
   - HTTP server — Routing normal por hostname (SNI)

### Rutas HTTP

| Hostname | Destino | Propósito |
|---|---|---|
| `api.crown-xpress-transport.app` | `localhost:80` | CRM API (nginx proxy) |
| `auth.crown-xpress-transport.app` | `localhost:80` | CRM Auth (nginx proxy) |
| `db.crown-xpress-transport.app` | `respond 200` | Health check + cert provisioning |
| `evenchess.jmbj2457.com` | `100.64.194.71:3000` | Otro servicio |

### Ruta TCP (PostgreSQL)

| Hostname | Puerto | Destino | Propósito |
|---|---|---|---|
| `db.crown-xpress-transport.app` | 443 | `127.0.0.1:5433` | PostgreSQL Crown-Xpress |

## Certificados TLS

- **Let's Encrypt** — Automático via ACME
- **db.crown-xpress-transport.app** — Certificado para PostgreSQL TLS
- **Renovación** — Automática por Caddy

## DNS

| Registro | Tipo | Valor |
|---|---|---|
| `db.crown-xpress-transport.app` | A | 74.208.37.187 |
| `api.crown-xpress-transport.app` | A | 74.208.37.187 |
| `auth.crown-xpress-transport.app` | A | 74.208.37.187 |

## Comandos Útiles

```bash
# Validar configuración
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

# Recargar sin reiniciar
systemctl reload caddy

# Ver estado
systemctl status caddy

# Ver logs
journalctl -u caddy --since '5 min ago' --no-pager

# Ver módulos instalados
caddy list-modules | grep layer4

# Backup Caddyfile
cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak
```

## CRM Existente (NO TOCAR)

Las rutas de `api.crown-xpress-transport.app` y `auth.crown-xpress-transport.app` son del CRM existente y **no se modificaron**. Solo se agregó la ruta `db.crown-xpress-transport.app` y el `listener_wrappers` con layer4.

## Backup y Rollback

```bash
# Backup binario original
cp /usr/bin/caddy /usr/bin/caddy.bak

# Backup Caddyfile
cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak

# Rollback
cp /usr/bin/caddy.bak /usr/bin/caddy
cp /etc/caddy/Caddyfile.bak /etc/caddy/Caddyfile
systemctl restart caddy
```
