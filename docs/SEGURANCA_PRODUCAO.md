# 🔐 Guia de Segurança para Produção

## JWT_SECRET - Proteção Crítica

### ⚠️ NUNCA faça isso:

```
❌ Usar uma senha fraca (<32 caracteres)
❌ Usar a mesma senha em dev e produção
```

### ✅ Recomendado:

```
1. Gerar secret forte (mínimo 32 caracteres):
   openssl rand -base64 32

2. Armazenar em serviço seguro:
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault
   - Environment variables encriptadas

3. Rotacionar regularmente (a cada 90 dias)

4. Usar secrets diferentes por ambiente:
   - development: JWT_SECRET_DEV
   - staging: JWT_SECRET_STAGING
   - production: JWT_SECRET_PROD

5. **JWT_REFRESH_SECRET** (opcional mas recomendado):
   - Secret separado para refresh tokens
   - Permite rotacionar access tokens sem invalidar refresh tokens
   - Maior segurança se um secret for comprometido
```

## HTTPS/TLS - Obrigatório em Produção

### ⚠️ Sem HTTPS:

- Tokens viajam em plain text
- Qualquer pessoa na rede pode interceptar
- Man-in-the-middle attacks

### ✅ Configurar HTTPS:

```
Opções:
1. Nginx reverse proxy com Let's Encrypt
2. AWS ALB com ACM certificate
3. CloudFlare SSL/TLS
4. Certificado self-signed para testes
```

### Verificação:

```bash
# Testar se HTTPS está funcionando
curl -I https://seu-servidor.com/api/auth/me
# Deve retortar 200 e headers de segurança
```

## CORS - Whitelist rigorosa

Seu app Flutter se conectará em um domínio específico.

### Configurar ALLOWED_ORIGINS:

```env
# Apenas seus domínios autorizados
ALLOWED_ORIGINS=https://seu-app.com,https://api.seu-app.com
```

## Backup de Dados

### ⚠️ Crítico:

```bash
# Fazer backup diário do banco PostgreSQL
pg_dump -U seu_usuario seu_database > backup-$(date +%Y%m%d).sql

# Armazenar em local seguro (cloud backup, S3, etc)
```

## Monitoramento em Produção

### Logs importantes:

- Tentativas de login falhadas
- Reset de senha múltiplas vezes
- Tokens revogados
- Erros de autenticação
