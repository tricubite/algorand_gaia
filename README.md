# Shopify + Algorand Demo

Encripta recibos de Shopify con AES-256-GCM y los envía a la blockchain de Algorand.

## Instalación

```bash
npm install
```

## Configuración

Copia `.env.example` a `.env`:

```bash
ALGO_SENDER=your_mnemonic_here
MONGODB_URI=mongodb://localhost:27017/shopify-algorand
```

## Ejecutar

**Servidor:**
```bash
npm start
```

**Test completo:**
```bash
node test-encryption-flow.js
```

## Flujo

1. Cliente genera claves Diffie-Hellman
2. Servidor y cliente comparten secreto criptográfico
3. Recibo se encripta con AES-256-GCM
4. Se envía a blockchain de Algorand
5. Se guarda en MongoDB
