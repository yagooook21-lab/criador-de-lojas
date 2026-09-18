import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'hostinger-secret-key-2026';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as health');
    res.json({ status: 'ok', db: 'connected', time: new Date() });
  } catch (error) {
    res.status(500).json({ status: 'error', db: error.message });
  }
});

// Helper to format values for MySQL
function formatValueForMySQL(val) {
  if (val === undefined || val === null) return null;
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toISOString().slice(0, 19).replace('T', ' ');
      }
    } catch (e) {}
  }
  if (typeof val === 'object' && !(val instanceof Date)) {
    return JSON.stringify(val);
  }
  return val;
}

// Helper to safely parse JSON columns
function parseJsonColumns(row) {
  if (!row) return row;
  const jsonFields = ['images', 'tags', 'pix_codes', 'boleto_codes', 'items', 'products', 'value', 'payload'];
  const newRow = { ...row };
  for (const field of jsonFields) {
    if (newRow[field] !== undefined && typeof newRow[field] === 'string') {
      try {
        newRow[field] = JSON.parse(newRow[field]);
      } catch (e) {
        // Keep string if not valid JSON
      }
    }
  }
  return newRow;
}

// --------------------------------------------------------------------------
// BACKGROUND WORKER: AUTO-RELEASE RESERVED PIX CODES AFTER 5 MINUTES
// --------------------------------------------------------------------------
async function autoReleaseExpiredPix() {
  try {
    const [result] = await pool.query(`
      UPDATE pix_pool 
      SET status = 'available', order_id = NULL, reserved_at = NULL 
      WHERE status = 'reserved' 
        AND reserved_at < NOW() - INTERVAL 5 MINUTE
    `);
    if (result.affectedRows > 0) {
      console.log(`[Auto-Release] ${result.affectedRows} códigos Pix não pagos liberados de volta para estoque disponível.`);
    }
  } catch (err) {
    console.error('[Auto-Release Error]:', err.message);
  }
}

// Run every 20 seconds
setInterval(autoReleaseExpiredPix, 20000);

// --------------------------------------------------------------------------
// PIX POOL DEDICATED ROUTES
// --------------------------------------------------------------------------

// 1. Bulk Insert Pix Codes
app.post('/api/pix-pool/bulk-insert', async (req, res) => {
  try {
    const { amount, tag, codes } = req.body;
    if (!amount || !Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ error: 'Valor e lista de códigos são obrigatórios.' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Valor inválido.' });
    }

    const inserted = [];
    for (const rawCode of codes) {
      const code = String(rawCode || '').trim();
      if (!code) continue;

      const id = crypto.randomUUID();
      await pool.query(`
        INSERT INTO pix_pool (id, amount, code, tag, status, created_at)
        VALUES (?, ?, ?, ?, 'available', NOW())
      `, [id, numAmount, code, tag || null]);

      inserted.push({ id, amount: numAmount, code, tag, status: 'available' });
    }

    res.json({ success: true, count: inserted.length, inserted });
  } catch (err) {
    console.error('Error inserting pix codes:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Pix Pool & Counts
app.get('/api/pix-pool', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, o.order_number, o.customer_name, o.customer_email 
      FROM pix_pool p
      LEFT JOIN orders o ON p.order_id = o.id
      ORDER BY p.created_at DESC
    `);

    const counts = {
      total: rows.length,
      available: rows.filter(r => r.status === 'available').length,
      reserved: rows.filter(r => r.status === 'reserved').length,
      paid: rows.filter(r => r.status === 'paid').length,
    };

    res.json({ codes: rows, counts });
  } catch (err) {
    console.error('Error fetching pix pool:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Delete a single code
app.delete('/api/pix-pool/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM pix_pool WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Clear codes by status
app.delete('/api/pix-pool/clear/:status', async (req, res) => {
  try {
    const { status } = req.params;
    if (status === 'all') {
      await pool.query('DELETE FROM pix_pool');
    } else {
      await pool.query('DELETE FROM pix_pool WHERE status = ?', [status]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Reserve an available Pix code for an Order
app.post('/api/pix-pool/reserve', async (req, res) => {
  try {
    const { amount, order_id, product_id } = req.body;
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount)) {
      return res.status(400).json({ error: 'Valor obrigatório' });
    }

    // Try finding exact amount match (or within 0.05 difference for rounding)
    const [candidates] = await pool.query(`
      SELECT * FROM pix_pool 
      WHERE status = 'available' 
        AND ABS(amount - ?) < 0.05
      ORDER BY created_at ASC 
      LIMIT 1
    `, [numAmount]);

    if (candidates.length === 0) {
      return res.json({ found: false, code: null });
    }

    const candidate = candidates[0];
    await pool.query(`
      UPDATE pix_pool 
      SET status = 'reserved', order_id = ?, product_id = ?, reserved_at = NOW() 
      WHERE id = ?
    `, [order_id || null, product_id || null, candidate.id]);

    res.json({ found: true, code: candidate.code, id: candidate.id });
  } catch (err) {
    console.error('Error reserving pix code:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5.1 Link Created Order to Reserved Pix Pool Code
app.post('/api/pix-pool/link-order', async (req, res) => {
  try {
    const { pool_id, order_id } = req.body;
    if (pool_id && order_id) {
      await pool.query("UPDATE pix_pool SET order_id = ? WHERE id = ?", [order_id, pool_id]);
      console.log(`[Pix Pool] Vinculado order_id ${order_id} ao código pool ${pool_id}`);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error linking order to pix pool:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Confirm Payment (Mark code and order as Paid permanently)
app.post('/api/pix-pool/confirm-payment', async (req, res) => {
  try {
    const { order_id, code_id } = req.body;
    
    if (order_id) {
      // Atualiza status do pedido para 'paid'
      await pool.query(`
        UPDATE orders 
        SET status = 'paid', payment_status = 'paid' 
        WHERE id = ? OR order_number = ?
      `, [order_id, order_id]);

      // Busca o pedido para verificar se utilizou código do pix_pool
      const [orders] = await pool.query(`
        SELECT id, order_number, notes FROM orders WHERE id = ? OR order_number = ?
      `, [order_id, order_id]);

      let poolId = null;
      let pixCode = null;
      if (orders.length > 0 && orders[0].notes) {
        try {
          const notes = typeof orders[0].notes === 'string' ? JSON.parse(orders[0].notes) : orders[0].notes;
          poolId = notes.pix_pool_id || notes.pixPoolId || null;
          pixCode = notes.pixCode || notes.pix_code || null;
        } catch (e) {}
      }

      // Marca o código no pix_pool como 'paid' para NÃO voltar a ficar disponível
      if (poolId) {
        await pool.query(`
          UPDATE pix_pool 
          SET status = 'paid', paid_at = NOW(), order_id = ? 
          WHERE id = ?
        `, [orders[0].id, poolId]);
        console.log(`[Pix Pool] Código pool ${poolId} marcado como PAGO definitivamente.`);
      } else if (pixCode) {
        await pool.query(`
          UPDATE pix_pool 
          SET status = 'paid', paid_at = NOW(), order_id = ? 
          WHERE code = ?
        `, [orders[0].id, pixCode]);
        console.log(`[Pix Pool] Código pool via payload marcado como PAGO definitivamente.`);
      } else {
        await pool.query(`
          UPDATE pix_pool 
          SET status = 'paid', paid_at = NOW() 
          WHERE order_id = ?
        `, [order_id]);
      }
    } else if (code_id) {
      await pool.query(`
        UPDATE pix_pool 
        SET status = 'paid', paid_at = NOW() 
        WHERE id = ?
      `, [code_id]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error confirming pix payment:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Manual Release of reserved code
app.post('/api/pix-pool/release', async (req, res) => {
  try {
    const { id, order_id } = req.body;
    if (id) {
      await pool.query(`
        UPDATE pix_pool 
        SET status = 'available', order_id = NULL, reserved_at = NULL 
        WHERE id = ? AND status = 'reserved'
      `, [id]);
    } else if (order_id) {
      await pool.query(`
        UPDATE pix_pool 
        SET status = 'available', order_id = NULL, reserved_at = NULL 
        WHERE order_id = ? AND status = 'reserved'
      `, [order_id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Clear all Pix Orders
app.post('/api/orders/clear-pix', async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM orders WHERE LOWER(payment_method) LIKE '%pix%' OR payment_method IS NULL OR payment_method = ''");
    await pool.query("UPDATE pix_pool SET status = 'available', order_id = NULL, reserved_at = NULL WHERE status = 'reserved'");
    console.log(`[Clear Pix Orders] ${result.affectedRows} pedidos Pix removidos.`);
    res.json({ success: true, count: result.affectedRows });
  } catch (err) {
    console.error('Error clearing pix orders:', err);
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------------------------
// MOTOR CENTRAL DE CRIAÇÃO DE PIX NO CHECKOUT
// Prioridade:
// 1. Pix Copia e Cola (Pool de Códigos por Valor Exato)
// 2. Chave Pix Estática (se houver chave cadastrada e ativa)
// 3. Gateway de Pagamento Ativo (FreePay Brasil, BlackCat, StreetPay, etc.)
// --------------------------------------------------------------------------

function calculateCRC16(payload) {
  let crc = 0xFFFF;
  const polynomial = 0x1021;
  for (let i = 0; i < payload.length; i++) {
    let b = payload.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      let bit = ((b >> (7 - j) & 1) === 1);
      let c15 = ((crc >> 15 & 1) === 1);
      crc <<= 1;
      if (c15 !== bit) crc ^= polynomial;
    }
  }
  crc &= 0xFFFF;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatField(id, value) {
  const safeValue = value || '';
  const len = safeValue.length.toString().padStart(2, '0');
  return `${id}${len}${safeValue}`;
}

function generateRandomId(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generatePixPayload({ key, name, city, amount, txid, description }) {
  const gui = formatField('00', 'br.gov.bcb.pix');
  const keyField = formatField('01', key);
  const descValue = description || generateRandomId(5);
  const info = formatField('26', `${gui}${keyField}${formatField('02', descValue)}`);
  const txidValue = txid || generateRandomId(5);
  const additionalData = formatField('62', formatField('05', txidValue));

  let payload = [
    formatField('00', '01'),
    info,
    formatField('52', '0000'),
    formatField('53', '986'),
    formatField('54', Number(amount).toFixed(2)),
    formatField('58', 'BR'),
    formatField('59', (name || 'LOJA').substring(0, 25)),
    formatField('60', (city || 'SAO PAULO').substring(0, 15)),
    additionalData,
  ].join('');

  payload += '6304';
  const crc = calculateCRC16(payload);
  return `${payload}${crc}`;
}

app.post('/api/pix/create-checkout-pix', async (req, res) => {
  try {
    const { amount, product_id, customer, address, items } = req.body;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Valor inválido para Pix' });
    }

    // =======================================================================
    // PRIORIDADE 1: PIX COPIA E COLA (Pool de Códigos por Valor Exato)
    // "somente quando tiver pix copia e cola cadastrado no painel que ele vira a prioridade"
    // =======================================================================
    const [poolCandidates] = await pool.query(`
      SELECT * FROM pix_pool 
      WHERE status = 'available' 
        AND ABS(amount - ?) < 0.05
      ORDER BY created_at ASC 
      LIMIT 1
    `, [numAmount]);

    if (poolCandidates.length > 0) {
      const candidate = poolCandidates[0];
      await pool.query(`
        UPDATE pix_pool 
        SET status = 'reserved', product_id = ?, reserved_at = NOW() 
        WHERE id = ?
      `, [product_id || null, candidate.id]);

      console.log(`[Pix Checkout] Código reservado da pool ID: ${candidate.id} para R$ ${numAmount.toFixed(2)}`);
      return res.json({
        success: true,
        source: 'pool',
        pix_code: candidate.code,
        qr_code_base64: '',
        pool_id: candidate.id,
        gateway: 'Pool Copia e Cola'
      });
    }

    // =======================================================================
    // PRIORIDADE 2: CHAVE PIX ESTÁTICA CADASTRADA E ATIVA
    // "quero que o pix estatico fique como prioridade somente quando o sistema detectar uma chave pix cadastrada na opção chave pix estatica"
    // =======================================================================
    const [staticRows] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'static_pix_keys'");
    let activeStaticKey = null;
    if (staticRows.length > 0 && staticRows[0].value) {
      try {
        const val = typeof staticRows[0].value === 'string' ? JSON.parse(staticRows[0].value) : staticRows[0].value;
        const list = Array.isArray(val) ? val : Object.values(val);
        activeStaticKey = list.find(k => k && k.active && k.credentials?.pix_key && String(k.credentials.pix_key).trim().length > 3);
      } catch (e) {}
    }

    if (activeStaticKey) {
      const key = String(activeStaticKey.credentials.pix_key).trim();
      const name = String(activeStaticKey.credentials.merchant_name || 'LOJA').trim();
      const city = String(activeStaticKey.credentials.merchant_city || 'SAO PAULO').trim();
      const payload = generatePixPayload({ key, name, city, amount: numAmount });

      console.log(`[Pix Checkout] Gerado via Chave Pix Estática cadastrada (${key})`);
      return res.json({
        success: true,
        source: 'static',
        pix_code: payload,
        qr_code_base64: '',
        gateway: 'Chave Pix Estática'
      });
    }

    // =======================================================================
    // PRIORIDADE 3: GATEWAY DE PAGAMENTO ATIVO CADASTRADO NO PAINEL
    // "e quando tiver so o getway de pagamento ativado no painel gerar somente nele"
    // =======================================================================
    const [gwRows] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'payment_gateways'");
    let activeGw = null;
    if (gwRows.length > 0 && gwRows[0].value) {
      try {
        const val = typeof gwRows[0].value === 'string' ? JSON.parse(gwRows[0].value) : gwRows[0].value;
        const list = Array.isArray(val) ? val : Object.values(val);
        activeGw = list.find(g => g && g.active);
      } catch (e) {}
    }

    const [pixSettingsRows] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'pix_settings'");
    let pixSettings = null;
    if (pixSettingsRows.length > 0 && pixSettingsRows[0].value) {
      try {
        pixSettings = typeof pixSettingsRows[0].value === 'string' ? JSON.parse(pixSettingsRows[0].value) : pixSettingsRows[0].value;
      } catch (e) {}
    }

    const provider = (activeGw?.provider_id || (pixSettings?.mode === 'api' ? pixSettings.gateway : '') || '').toLowerCase();
    const creds = activeGw?.credentials || pixSettings || {};

    const custName = customer?.name || 'Cliente';
    const custEmail = customer?.email || `cliente_${Date.now()}@gmail.com`;
    const custPhone = (customer?.phone || '11999999999').replace(/\D/g, '');
    const rawDoc = (customer?.document || '00000000000').replace(/\D/g, '');
    const custDoc = rawDoc.length > 0 ? rawDoc : '00000000000';
    const cents = Math.round(numAmount * 100);
    const internalOrderId = `PEDIDO_${Date.now()}`;
    const itemTitle = (items && items[0]?.name) ? items[0].name : `Pedido Mercado Livre R$ ${numAmount.toFixed(2)}`;

    // --- FREEPAY BRASIL ---
    if (provider.includes('freepay') || provider === 'freepay') {
      const publicKey = creds.public_key || creds.publicKey;
      const secretKey = creds.secret_key || creds.secretKey || creds.api_secret;

      if (!publicKey || !secretKey) {
        return res.status(400).json({ error: 'Credenciais FreePay incompletas no painel' });
      }

      const authToken = Buffer.from(`${publicKey}:${secretKey}`).toString('base64');
      const host = req.get('host') || '143.95.164.119';
      const proto = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';

      const fpPayload = {
        amount: cents,
        payment_method: 'pix',
        customer: {
          name: custName,
          email: custEmail,
          phone: custPhone,
          document: { type: custDoc.length > 11 ? 'cnpj' : 'cpf', number: custDoc }
        },
        items: [{ title: itemTitle, unit_price: cents, quantity: 1, tangible: true }],
        pix: { expires_in_days: 1 },
        postback_url: `${proto}://${host}/api/webhook/freepay`,
        metadata: { provider: 'Mercado Livre', order_id: internalOrderId }
      };

      const fpRes = await fetch('https://api.freepaybrasil.com/v1/payment-transaction/create', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(fpPayload)
      });

      const fpData = await fpRes.json();
      console.log('[FreePay API create]', fpRes.status, JSON.stringify(fpData).substring(0, 300));

      const pixCode = fpData?.data?.pix?.qr_code || 
                      fpData?.data?.[0]?.pix?.[0]?.qr_code || 
                      fpData?.pix?.qr_code || '';
      const txId = fpData?.data?.id || fpData?.data?.[0]?.id || fpData?.id || '';

      if (pixCode) {
        return res.json({
          success: true,
          source: 'gateway',
          pix_code: pixCode,
          qr_code_base64: '',
          transaction_id: txId,
          gateway: 'FREEPAY BRASIL'
        });
      } else {
        return res.status(400).json({ error: 'Erro ao gerar Pix no FreePay: ' + JSON.stringify(fpData?.errors || fpData?.error_messages || fpData) });
      }
    }

    // --- BLACK CAT ---
    if (provider.includes('blackcat')) {
      const apiKey = creds.api_key || creds.secret_key;
      if (apiKey) {
        const host = req.get('host') || '143.95.164.119';
        const proto = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';

        const bcRes = await fetch("https://api.blackcatpay.com.br/api/sales/create-sale", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
          body: JSON.stringify({
            amount: cents,
            currency: "BRL",
            paymentMethod: "pix",
            items: [{ title: itemTitle, unitPrice: cents, quantity: 1, tangible: false }],
            customer: {
              name: custName,
              email: custEmail,
              phone: custPhone,
              document: { number: custDoc, type: custDoc.length > 11 ? "cnpj" : "cpf" }
            },
            pix: { expiresInDays: 1 },
            externalRef: internalOrderId,
            postbackUrl: `${proto}://${host}/api/webhook/blackcat`,
            metadata: { orderId: internalOrderId }
          })
        });
        const bcData = await bcRes.json();
        const pixCode = bcData?.data?.paymentData?.copyPaste || bcData?.copyPaste || bcData?.qrCode;
        const qrBase64 = bcData?.data?.paymentData?.qrCodeBase64 || bcData?.qrCodeBase64 || '';
        const txId = bcData?.data?.transactionId || bcData?.transactionId || '';
        if (pixCode) {
          return res.json({
            success: true,
            source: 'gateway',
            pix_code: pixCode,
            qr_code_base64: qrBase64,
            transaction_id: txId,
            gateway: 'BLACK CAT'
          });
        }
      }
    }

    // --- STREET PAY ---
    if (provider.includes('streetpay')) {
      const apiKey = creds.api_key || creds.secret_key;
      if (apiKey) {
        const host = req.get('host') || '143.95.164.119';
        const proto = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';

        const spRes = await fetch("https://api.streetpays.com.br/v1/payment", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({
            amount: cents,
            paymentMethod: "PIX",
            customer: { name: custName, email: custEmail, phone: custPhone, document: custDoc },
            items: [{ title: itemTitle, unitPrice: cents, quantity: 1, tangible: true }],
            externalRef: internalOrderId,
            postbackUrl: `${proto}://${host}/api/webhook/streetpay`
          })
        });
        const spData = await spRes.json();
        const pixCode = spData?.pix?.qr_code || spData?.qr_code || '';
        const txId = spData?.id || '';
        if (pixCode) {
          return res.json({
            success: true,
            source: 'gateway',
            pix_code: pixCode,
            qr_code_base64: '',
            transaction_id: txId,
            gateway: 'STREETPAY'
          });
        }
      }
    }

    return res.status(400).json({ error: 'Nenhum método Pix configurado ou disponível' });
  } catch (err) {
    console.error('Error creating checkout pix:', err);
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------------------------
// SISTEMA AUTOMÁTICO DE DETECÇÃO E CONFIRMAÇÃO DE PAGAMENTOS PIX
// --------------------------------------------------------------------------

// 1. Marca um pedido e eventual código do pix_pool como PAGO definitivamente
async function markOrderAsPaid(orderIdentifier, poolId = null, txId = null) {
  try {
    let query = "SELECT * FROM orders WHERE id = ? OR order_number = ?";
    let params = [orderIdentifier, orderIdentifier];

    if (!orderIdentifier && txId) {
      query = "SELECT * FROM orders WHERE notes LIKE ?";
      params = [`%${txId}%`];
    }

    const [orders] = await pool.query(query, params);
    if (!orders || orders.length === 0) {
      console.warn(`[markOrderAsPaid] Pedido não encontrado para id: ${orderIdentifier} / tx: ${txId}`);
      return false;
    }

    const order = orders[0];
    if (order.status === 'paid' && order.payment_status === 'paid') {
      return true; // Já marcado anteriormente
    }

    await pool.query("UPDATE orders SET status = 'paid', payment_status = 'paid' WHERE id = ?", [order.id]);
    console.log(`[markOrderAsPaid] SUCESSO: Pedido ${order.order_number || order.id} marcado como PAGO no banco.`);

    // Se o pedido usou pool de Pix Copia e Cola, marca como 'paid' para NUNCA voltar a ficar disponível
    let pId = poolId;
    let pCode = null;
    if (order.notes) {
      try {
        const notes = typeof order.notes === 'string' ? JSON.parse(order.notes) : order.notes;
        pId = pId || notes.pix_pool_id || notes.pixPoolId;
        pCode = notes.pixCode || notes.pix_code;
      } catch (e) {}
    }

    if (pId) {
      await pool.query("UPDATE pix_pool SET status = 'paid', paid_at = NOW(), order_id = ? WHERE id = ?", [order.id, pId]);
      console.log(`[markOrderAsPaid] Código pix_pool ${pId} marcado como PAGO definitivamente.`);
    } else if (pCode) {
      await pool.query("UPDATE pix_pool SET status = 'paid', paid_at = NOW(), order_id = ? WHERE code = ?", [order.id, pCode]);
      console.log(`[markOrderAsPaid] Código pix_pool (por payload exato) marcado como PAGO.`);
    }

    return true;
  } catch (err) {
    console.error('[markOrderAsPaid Error]', err);
    return false;
  }
}

// Cache em memória de status de gateways para evitar limite 429 de requisições rápidas
const gwStatusCache = new Map();

// 2. Consulta de status em múltiplos Gateways (FreePay, BlackCat, StreetPay, PrimeCash, etc.)
async function checkGatewayTransactionStatus(txId, gatewayName, creds) {
  if (!txId) return { isPaid: false, status: 'UNKNOWN' };
  const gw = (gatewayName || '').toString().toLowerCase();

  const cacheKey = `${gw}:${txId}`;
  const cached = gwStatusCache.get(cacheKey);
  if (cached && (Date.now() - cached.time < 3500)) {
    return cached.result;
  }

  // A. FreePay Brasil
  if (gw.includes('freepay')) {
    const pub = creds.public_key || creds.publicKey;
    const sec = creds.secret_key || creds.secretKey;
    if (pub && sec) {
      try {
        const auth = Buffer.from(`${pub}:${sec}`).toString('base64');
        const res = await fetch(`https://api.freepaybrasil.com/v1/payment-transaction/info/${txId}`, {
          headers: { "Authorization": `Basic ${auth}`, "Accept": "application/json" }
        });
        if (res.ok) {
          const data = await res.json();
          const status = (data?.data?.status || data?.status || '').toString().toUpperCase();
          const isPaid = status === 'PAID' || status === 'APPROVED' || status === 'CONFIRMED';
          return { isPaid, status: status || 'PENDING', raw: data };
        }
      } catch (e) {
        console.error('[checkGateway FreePay error]', e.message);
      }
    }
  }

  // B. BlackCat
  if (gw.includes('blackcat')) {
    const apiKey = creds.api_key || creds.secret_key;
    if (apiKey) {
      try {
        const endpoints = [
          `https://api.blackcatpay.com.br/api/sales/${txId}`,
          `https://api.blackcatoficial.com/api/sales/${txId}`,
          `https://api.blackcatpay.com.br/api/sales/get-sale?id=${txId}`
        ];
        for (const ep of endpoints) {
          try {
            const res = await fetch(ep, {
              headers: { "X-API-Key": apiKey, "Accept": "application/json" }
            });
            if (res.ok) {
              const data = await res.json();
              const status = (data?.data?.status || data?.status || data?.sale?.status || '').toString().toUpperCase();
              const isPaid = status === 'PAID' || status === 'APPROVED' || status === 'CONFIRMED' || status === 'PAGO';
              return { isPaid, status: status || 'PENDING', raw: data };
            }
          } catch (e) {}
        }
      } catch (e) {
        console.error('[checkGateway BlackCat error]', e.message);
      }
    }
  }

  // C. StreetPay
  if (gw.includes('streetpay')) {
    const apiKey = creds.api_key || creds.secret_key;
    if (apiKey) {
      try {
        const res = await fetch(`https://api.streetpays.com.br/v1/payment/${txId}`, {
          headers: { "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" }
        });
        if (res.ok) {
          const data = await res.json();
          const status = (data?.data?.status || data?.status || '').toString().toUpperCase();
          const isPaid = status === 'PAID' || status === 'APPROVED' || status === 'CONFIRMED';
          return { isPaid, status: status || 'PENDING', raw: data };
        }
      } catch (e) {
        console.error('[checkGateway StreetPay error]', e.message);
      }
    }
  }

  // D. PrimeCash
  if (gw.includes('primecash')) {
    const pub = creds.public_key || creds.publicKey;
    const sec = creds.secret_key || creds.secretKey;
    if (pub && sec) {
      try {
        const auth = Buffer.from(`${pub}:${sec}`).toString('base64');
        const res = await fetch(`https://api.primecash.com.br/v1/transactions/${txId}`, {
          headers: { "Authorization": `Basic ${auth}`, "Accept": "application/json" }
        });
        if (res.ok) {
          const data = await res.json();
          const status = (data?.data?.status || data?.status || '').toString().toUpperCase();
          const isPaid = status === 'PAID' || status === 'APPROVED' || status === 'CONFIRMED';
          return { isPaid, status: status || 'PENDING', raw: data };
        }
      } catch (e) {}
    }
  }

  return { isPaid: false, status: 'PENDING' };
}

// 3. Endpoint de checagem chamado pelo Checkout do cliente
app.get('/api/gateway/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { gateway, order_id } = req.query;

    // A. Checagem prioritária no MySQL (se já estiver pago no banco, responde em 1ms sem bater no Gateway)
    const sqlConds = [];
    const sqlParams = [];
    if (order_id) {
      sqlConds.push("id = ? OR order_number = ?");
      sqlParams.push(order_id, order_id);
    }
    if (transactionId && transactionId !== 'undefined' && transactionId !== 'null') {
      sqlConds.push("notes LIKE ?");
      sqlParams.push(`%"${transactionId}"%`);
    }

    if (sqlConds.length > 0) {
      const [orderRows] = await pool.query(
        `SELECT id, order_number, status, payment_status, total FROM orders WHERE ${sqlConds.join(' OR ')} LIMIT 1`,
        sqlParams
      );
      if (orderRows.length > 0) {
        const ord = orderRows[0];
        if (ord.status === 'paid' || ord.payment_status === 'paid') {
          return res.json({ isPaid: true, status: 'PAID', orderId: ord.id, orderNumber: ord.order_number });
        }
      }
    }

    const [gwRows] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'payment_gateways'");
    let activeGw = null;
    if (gwRows.length > 0 && gwRows[0].value) {
      try {
        const val = typeof gwRows[0].value === 'string' ? JSON.parse(gwRows[0].value) : gwRows[0].value;
        const list = Array.isArray(val) ? val : Object.values(val);
        activeGw = list.find(g => g && g.active);
      } catch (e) {}
    }

    const [pixSettingsRows] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'pix_settings'");
    let pixSettings = null;
    if (pixSettingsRows.length > 0 && pixSettingsRows[0].value) {
      try {
        pixSettings = typeof pixSettingsRows[0].value === 'string' ? JSON.parse(pixSettingsRows[0].value) : pixSettingsRows[0].value;
      } catch (e) {}
    }

    const provider = (gateway || activeGw?.provider_id || pixSettings?.gateway || '').toString().toLowerCase();
    const creds = activeGw?.credentials || pixSettings?.credentials || pixSettings || {};

    const checkResult = await checkGatewayTransactionStatus(transactionId, provider, creds);

    // Se detectou pago, marca IMEDIATAMENTE no MySQL para o lojista e para o cliente
    if (checkResult.isPaid) {
      await markOrderAsPaid(order_id || null, null, transactionId);
    }

    return res.json(checkResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint dedicado para o frontend checar status do pedido por ID ou Order Number
app.get('/api/order/status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { txId, gateway } = req.query;

    const [rows] = await pool.query(
      "SELECT id, order_number, status, payment_status, notes FROM orders WHERE id = ? OR order_number = ? LIMIT 1",
      [orderId, orderId]
    );

    if (rows.length > 0) {
      const ord = rows[0];
      if (ord.status === 'paid' || ord.payment_status === 'paid') {
        return res.json({ isPaid: true, status: 'PAID', orderId: ord.id, orderNumber: ord.order_number });
      }

      let effectiveTxId = txId;
      let effectiveGw = gateway;
      if (!effectiveTxId && ord.notes) {
        try {
          const notes = typeof ord.notes === 'string' ? JSON.parse(ord.notes) : ord.notes;
          effectiveTxId = notes.transactionId || notes.transaction_id;
          effectiveGw = notes.gateway || effectiveGw;
        } catch (e) {}
      }

      if (effectiveTxId && effectiveTxId !== 'undefined' && effectiveTxId !== 'null') {
        const [gwRows] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'payment_gateways'");
        let activeGw = null;
        if (gwRows.length > 0 && gwRows[0].value) {
          try {
            const val = typeof gwRows[0].value === 'string' ? JSON.parse(gwRows[0].value) : gwRows[0].value;
            const list = Array.isArray(val) ? val : Object.values(val);
            activeGw = list.find(g => g && g.active);
          } catch (e) {}
        }

        const [pixSettingsRows] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'pix_settings'");
        let pixSettings = null;
        if (pixSettingsRows.length > 0 && pixSettingsRows[0].value) {
          try {
            pixSettings = typeof pixSettingsRows[0].value === 'string' ? JSON.parse(pixSettingsRows[0].value) : pixSettingsRows[0].value;
          } catch (e) {}
        }

        const provider = (effectiveGw || activeGw?.provider_id || pixSettings?.gateway || '').toString().toLowerCase();
        const creds = activeGw?.credentials || pixSettings?.credentials || pixSettings || {};

        const checkResult = await checkGatewayTransactionStatus(effectiveTxId, provider, creds);
        if (checkResult.isPaid) {
          await markOrderAsPaid(ord.id, null, effectiveTxId);
          return res.json({ isPaid: true, status: 'PAID', orderId: ord.id, orderNumber: ord.order_number });
        }
      }

      return res.json({ isPaid: false, status: ord.status, orderId: ord.id, orderNumber: ord.order_number });
    }

    return res.json({ isPaid: false, status: 'NOT_FOUND' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Worker automático que roda no servidor sincronizando pedidos pendentes
async function syncPendingPixOrders() {
  try {
    const [orders] = await pool.query(`
      SELECT * FROM orders 
      WHERE LOWER(payment_method) LIKE '%pix%' 
        AND (status = 'pending' OR payment_status = 'pending')
        AND created_at >= NOW() - INTERVAL 48 HOUR
      ORDER BY created_at DESC 
      LIMIT 25
    `);

    if (!orders || orders.length === 0) return 0;

    const [gwRows] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'payment_gateways'");
    let activeGw = null;
    if (gwRows.length > 0 && gwRows[0].value) {
      try {
        const val = typeof gwRows[0].value === 'string' ? JSON.parse(gwRows[0].value) : gwRows[0].value;
        const list = Array.isArray(val) ? val : Object.values(val);
        activeGw = list.find(g => g && g.active);
      } catch (e) {}
    }

    const [pixSettingsRows] = await pool.query("SELECT `value` FROM settings WHERE `key` = 'pix_settings'");
    let pixSettings = null;
    if (pixSettingsRows.length > 0 && pixSettingsRows[0].value) {
      try {
        pixSettings = typeof pixSettingsRows[0].value === 'string' ? JSON.parse(pixSettingsRows[0].value) : pixSettingsRows[0].value;
      } catch (e) {}
    }

    let updatedCount = 0;
    for (const order of orders) {
      let txId = null;
      let gw = null;
      try {
        const notes = typeof order.notes === 'string' ? JSON.parse(order.notes) : (order.notes || {});
        txId = notes.transactionId || notes.transaction_id || null;
        gw = notes.gateway || null;
      } catch (e) {}

      if (!txId) continue;

      const provider = (gw || activeGw?.provider_id || pixSettings?.gateway || '').toString().toLowerCase();
      const creds = activeGw?.credentials || pixSettings?.credentials || pixSettings || {};

      const checkResult = await checkGatewayTransactionStatus(txId, provider, creds);
      if (checkResult.isPaid) {
        const updated = await markOrderAsPaid(order.id, null, txId);
        if (updated) updatedCount++;
      }

      // Throttle de 2.2s entre cada consulta para respeitar rate limits dos gateways (ex: FreePay 429)
      await new Promise(r => setTimeout(r, 2200));
    }

    if (updatedCount > 0) {
      console.log(`[Auto-Sync Pix] ${updatedCount} pedido(s) Pix detectado(s) e marcado(s) como PAGO.`);
    }
    return updatedCount;
  } catch (err) {
    return 0;
  }
}

// Dispara o worker a cada 15 segundos ininterruptos
setInterval(syncPendingPixOrders, 15000);

// Endpoint manual de sincronização para o botão do painel
app.post('/api/gateway/sync-pending', async (req, res) => {
  try {
    const updated = await syncPendingPixOrders();
    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Recepção Universal de Webhooks / Postbacks de Gateways
app.all(['/api/webhook', '/api/webhook/:gateway', '/api/webhooks', '/api/webhooks/:gateway', '/api/webhooks/pix'], async (req, res) => {
  try {
    const payload = req.body || {};
    const query = req.query || {};
    const gateway = req.params.gateway || query.gateway || 'default';
    console.log(`[Webhook ${gateway}] Recebido:`, JSON.stringify(payload).substring(0, 300));

    // Extrai o ID da transação
    const txId = payload.id || 
                 payload.transaction_id || 
                 payload.transactionId || 
                 payload.data?.id || 
                 payload.data?.transactionId || 
                 payload.data?.transaction_id || '';

    // Extrai o status da notificação
    const rawStatus = (
      payload.status || 
      payload.data?.status || 
      payload.event || 
      payload.type || 
      payload.current_status || 
      ''
    ).toString().toUpperCase();

    const isPaid = rawStatus === 'PAID' || 
                   rawStatus === 'CONFIRMED' || 
                   rawStatus === 'COMPLETED' || 
                   rawStatus === 'APPROVED' || 
                   rawStatus === 'PAGO' ||
                   rawStatus.includes('PAYMENT_CONFIRMED') ||
                   rawStatus.includes('TRANSACTION_PAID');

    // Extrai o ID do pedido se enviado pelo Gateway
    const orderId = payload.metadata?.order_id || 
                    payload.data?.metadata?.order_id || 
                    payload.externalRef || 
                    payload.external_id || 
                    payload.data?.external_id || '';

    let updated = false;
    if (isPaid && (txId || orderId)) {
      updated = await markOrderAsPaid(orderId || null, null, txId || null);
    }

    res.status(200).json({ received: true, isPaid, updated });
  } catch (err) {
    console.error('[Webhook Error]', err);
    res.status(200).json({ received: true, error: err.message });
  }
});

// --------------------------------------------------------------------------
// AUTHENTICATION ROUTES
// --------------------------------------------------------------------------

app.post('/api/auth/v1/token', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid login credentials', error_description: 'User not found' });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password).catch(() => false) || (user.password === password);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Invalid login credentials', error_description: 'Invalid password' });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role || 'authenticated' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      access_token: token,
      token_type: 'bearer',
      expires_in: 604800,
      user: {
        id: user.id,
        email: user.email,
        role: user.role || 'authenticated',
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Auth token error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/v1/signup', async (req, res) => {
  try {
    const { email, password, data } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already registered' });
    }

    const id = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)', [
      id, email, hashedPassword, 'authenticated'
    ]);

    const token = jwt.sign({ sub: id, email, role: 'authenticated' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      access_token: token,
      token_type: 'bearer',
      user: { id, email, role: 'authenticated', created_at: new Date() }
    });
  } catch (err) {
    console.error('Auth signup error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/v1/user', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [users] = await pool.query('SELECT id, email, role, created_at FROM users WHERE id = ?', [decoded.sub]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(users[0]);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// --------------------------------------------------------------------------
// GENERIC QUERY ROUTE (POST /api/query - Handles Supabase JS style queries)
// --------------------------------------------------------------------------
app.post('/api/query', async (req, res) => {
  try {
    const { table, method, select, filters = [], orders = [], limit, offset, single, countOnly, data, upsertOnConflict } = req.body;
    
    // Sanitize table name (only alphanumeric and underscore)
    if (!table || !/^[a-zA-Z0-9_]+$/.test(table)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }

    // SELECT
    if (method === 'SELECT') {
      let query = `SELECT * FROM \`${table}\``;
      const params = [];
      const whereClauses = [];

      for (const filter of filters) {
        const { column, operator, value } = filter;

        if (operator === 'or' && (filter.raw || filter.value)) {
          const rawStr = filter.raw || filter.value;
          const parts = rawStr.split(',');
          const orClauses = [];
          for (const part of parts) {
            const segments = part.split('.');
            if (segments.length >= 3) {
              const col = segments[0].trim();
              const op = segments[1].trim();
              const val = segments.slice(2).join('.').trim();
              if (/^[a-zA-Z0-9_]+$/.test(col)) {
                if (op === 'eq') {
                  orClauses.push(`\`${col}\` = ?`);
                  params.push(formatValueForMySQL(val));
                } else if (op === 'neq') {
                  orClauses.push(`\`${col}\` != ?`);
                  params.push(formatValueForMySQL(val));
                } else if (op === 'like' || op === 'ilike') {
                  orClauses.push(`\`${col}\` LIKE ?`);
                  params.push(formatValueForMySQL(val));
                }
              }
            }
          }
          if (orClauses.length > 0) {
            whereClauses.push(`(${orClauses.join(' OR ')})`);
          }
          continue;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(column)) continue;

        const formattedVal = formatValueForMySQL(value);

        if (operator === 'eq') {
          whereClauses.push(`\`${column}\` = ?`);
          params.push(formattedVal);
        } else if (operator === 'neq') {
          whereClauses.push(`\`${column}\` != ?`);
          params.push(formattedVal);
        } else if (operator === 'gt') {
          whereClauses.push(`\`${column}\` > ?`);
          params.push(formattedVal);
        } else if (operator === 'gte') {
          whereClauses.push(`\`${column}\` >= ?`);
          params.push(formattedVal);
        } else if (operator === 'lt') {
          whereClauses.push(`\`${column}\` < ?`);
          params.push(formattedVal);
        } else if (operator === 'lte') {
          whereClauses.push(`\`${column}\` <= ?`);
          params.push(formattedVal);
        } else if (operator === 'like' || operator === 'ilike') {
          whereClauses.push(`\`${column}\` LIKE ?`);
          params.push(formattedVal);
        } else if (operator === 'in' && Array.isArray(value) && value.length > 0) {
          const placeholders = value.map(() => '?').join(',');
          whereClauses.push(`\`${column}\` IN (${placeholders})`);
          params.push(...value.map(formatValueForMySQL));
        } else if (operator === 'is') {
          if (value === null) {
            whereClauses.push(`\`${column}\` IS NULL`);
          } else {
            whereClauses.push(`\`${column}\` IS ?`);
            params.push(formattedVal);
          }
        }
      }

      if (whereClauses.length > 0) {
        query += ` WHERE ${whereClauses.join(' AND ')}`;
      }

      // If countOnly requested
      if (countOnly) {
        const countQuery = query.replace('SELECT * FROM', 'SELECT COUNT(*) as count FROM');
        const [countRows] = await pool.query(countQuery, params);
        const total = countRows[0]?.count ?? 0;
        return res.json({ data: [], count: Number(total), error: null });
      }

      if (orders && orders.length > 0) {
        const orderClauses = orders
          .filter(o => /^[a-zA-Z0-9_]+$/.test(o.column))
          .map(o => `\`${o.column}\` ${o.ascending ? 'ASC' : 'DESC'}`);
        if (orderClauses.length > 0) {
          query += ` ORDER BY ${orderClauses.join(', ')}`;
        }
      }

      if (typeof limit === 'number') {
        query += ` LIMIT ${parseInt(limit, 10)}`;
        if (typeof offset === 'number') {
          query += ` OFFSET ${parseInt(offset, 10)}`;
        }
      }

      const [rows] = await pool.query(query, params);
      const parsedRows = rows.map(parseJsonColumns);

      if (single) {
        return res.json({ data: parsedRows[0] || null, error: null, count: parsedRows.length });
      }
      return res.json({ data: parsedRows, error: null, count: parsedRows.length });
    }

    // INSERT
    if (method === 'INSERT') {
      const records = Array.isArray(data) ? data : [data];
      const insertedResults = [];

      for (const record of records) {
        const item = { ...record };
        if (!item.id && table !== 'site_stats') {
          item.id = crypto.randomUUID();
        }

        const keys = Object.keys(item).filter(k => /^[a-zA-Z0-9_]+$/.test(k));
        const formattedValues = keys.map(k => formatValueForMySQL(item[k]));
        const placeholders = keys.map(() => '?').join(', ');
        const columns = keys.map(k => `\`${k}\``).join(', ');

        let query = `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders})`;

        if (upsertOnConflict) {
          const updateClauses = keys
            .filter(k => k !== 'id' && k !== upsertOnConflict)
            .map(k => `\`${k}\` = VALUES(\`${k}\`)`);
          if (updateClauses.length > 0) {
            query += ` ON DUPLICATE KEY UPDATE ${updateClauses.join(', ')}`;
          }
        }

        await pool.query(query, formattedValues);
        insertedResults.push(item);
      }

      const result = single ? parseJsonColumns(insertedResults[0]) : insertedResults.map(parseJsonColumns);
      return res.json({ data: result, error: null });
    }

    // UPDATE
    if (method === 'UPDATE') {
      const item = { ...data };
      delete item.id;

      const updateKeys = Object.keys(item).filter(k => /^[a-zA-Z0-9_]+$/.test(k));
      if (updateKeys.length === 0) {
        return res.json({ data: null, error: 'No update data provided' });
      }

      const setClauses = updateKeys.map(k => `\`${k}\` = ?`).join(', ');
      const params = updateKeys.map(k => formatValueForMySQL(item[k]));
      const whereClauses = [];

      for (const filter of filters) {
        const { column, operator, value } = filter;
        if (!/^[a-zA-Z0-9_]+$/.test(column)) continue;
        const formattedVal = formatValueForMySQL(value);
        if (operator === 'eq') {
          whereClauses.push(`\`${column}\` = ?`);
          params.push(formattedVal);
        } else if (operator === 'neq') {
          whereClauses.push(`\`${column}\` != ?`);
          params.push(formattedVal);
        }
      }

      if (whereClauses.length === 0) {
        return res.status(400).json({ error: 'Update requires at least one condition' });
      }

      const query = `UPDATE \`${table}\` SET ${setClauses} WHERE ${whereClauses.join(' AND ')}`;
      await pool.query(query, params);

      return res.json({ data: parseJsonColumns(data), error: null });
    }

    // DELETE
    if (method === 'DELETE') {
      const params = [];
      const whereClauses = [];

      for (const filter of filters) {
        const { column, operator, value } = filter;
        if (!/^[a-zA-Z0-9_]+$/.test(column)) continue;
        const formattedVal = formatValueForMySQL(value);
        if (operator === 'eq') {
          whereClauses.push(`\`${column}\` = ?`);
          params.push(formattedVal);
        } else if (operator === 'neq') {
          whereClauses.push(`\`${column}\` != ?`);
          params.push(formattedVal);
        }
      }

      if (whereClauses.length === 0) {
        return res.status(400).json({ error: 'Delete requires at least one condition' });
      }

      const query = `DELETE FROM \`${table}\` WHERE ${whereClauses.join(' AND ')}`;
      await pool.query(query, params);

      return res.json({ data: true, error: null });
    }

    res.status(400).json({ error: 'Unsupported method' });
  } catch (err) {
    console.error('API Query Error:', err);
    res.status(500).json({ data: null, error: { message: err.message, code: err.code } });
  }
});

// --------------------------------------------------------------------------
// LIVE VISITORS REAL-TIME LEAVE & CLEANUP
// --------------------------------------------------------------------------
app.post('/api/visitors/leave', express.text({ type: '*/*' }), async (req, res) => {
  try {
    let session_id = null;
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        session_id = parsed?.session_id;
      } catch (_) {
        session_id = req.body;
      }
    } else if (req.body && typeof req.body === 'object') {
      session_id = req.body.session_id;
    }

    if (session_id) {
      await pool.query('DELETE FROM live_visitors WHERE session_id = ?', [session_id]);
    }
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Auto-cleanup stale live_visitors not seen in the last 35 seconds (using UTC)
setInterval(async () => {
  try {
    await pool.query("DELETE FROM live_visitors WHERE last_seen < UTC_TIMESTAMP() - INTERVAL 35 SECOND");
  } catch (err) {
    // Ignore cleanup error
  }
}, 5000);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Hostinger Express MySQL API Server running on port ${PORT}`);
});

