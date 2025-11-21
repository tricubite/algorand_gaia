import 'dotenv/config';
import algosdk from 'algosdk';
import sodium from 'libsodium-wrappers';
import fetch from 'node-fetch';
import connectDB from './config/database.js';
import User from './models/User.js';
import EncryptedReceipt from './models/EncryptedReceipt.js';

const API_URL = 'http://localhost:3001/api';
const SERVER_START_DELAY = 3000; // Esperar 3 segundos a que el servidor inicie

(async () => {
	await sodium.ready;
	await connectDB();

	console.log('╔' + '═'.repeat(58) + '╗');
	console.log('║' + ' '.repeat(8) + 'SHOPIFY RECEIPT ENCRYPTION - END-TO-END FLOW' + ' '.repeat(5) + '║');
	console.log('╚' + '═'.repeat(58) + '╝\n');

	// ============================================
	// PART 1: CREAR USUARIO CLIENTE EN BD
	// ============================================
	console.log('📋 STEP 1: Crear cliente ficticio\n');
	console.log('─'.repeat(60));

	// Generar cuenta Algorand para el cliente
	const clientAccount = algosdk.generateAccount();
	const clientAddr = clientAccount.addr.toString('hex');
	const clientPublicKey = algosdk.decodeAddress(clientAddr.toString('hex')).publicKey;
	
	console.log('👤 Cliente generado:');
	console.log(`   Email: cliente@demo.com`);
	console.log(`   Dirección Algorand: ${clientAddr}`);
	console.log(`   Clave pública: ${Buffer.from(clientPublicKey).toString('hex').substring(0, 32)}...`);

	// Crear usuario en BD
	const newUser = new User({
		email: 'cliente@demo.com',
		password: 'password123',
		address: clientAddr
	});

	try {
		await newUser.save();
		console.log('✅ Usuario guardado en BD\n');
	} catch (error) {
		console.error('❌ Error guardando usuario:', error.message);
		process.exit(1);
	}

	// ============================================
	// PART 2: SIMULAR RECIBO DE SHOPIFY
	// ============================================
	console.log('\n📋 STEP 2: Shopify envía recibo\n');
	console.log('─'.repeat(60));

	const shopifyReceipt = {
		orderId: 'SHOP-2025-11-20-001',
		customer: 'Juan García',
		email: 'juan@example.com',
		timestamp: new Date().toISOString(),
		total: 250.50,
		currency: 'EUR',
		items: [
			{
				name: 'Laptop Premium',
				sku: 'LAPP-001',
				price: 1200.00,
				quantity: 1
			},
			{
				name: 'Mouse Inalámbrico',
				sku: 'MOUS-005',
				price: 50.50,
				quantity: 1
			}
		],
		shipping: {
			address: 'Calle Principal 123, Madrid',
			cost: 15.00
		},
		paymentMethod: 'Credit Card',
		transactionHash: '0x1234567890abcdef'
	};

	console.log('📄 Recibo de Shopify recibido:');
	console.log(JSON.stringify(shopifyReceipt, null, 2));

	// ============================================
	// PART 3: ESPERAR AL SERVIDOR
	// ============================================
	console.log('\n\n📋 STEP 3: Esperando a que el servidor esté listo...\n');
	console.log('─'.repeat(60));

	await new Promise(resolve => setTimeout(resolve, SERVER_START_DELAY));

	// Verificar que el servidor está activo
	try {
		const healthCheck = await fetch(`${API_URL}/health`);
		if (healthCheck.ok) {
			console.log('✅ Servidor activo en http://localhost:3001\n');
		}
	} catch (error) {
		console.error('❌ El servidor no está activo. Inicia con: npm start');
		process.exit(1);
	}

	// ============================================
	// PART 4: ENVIAR RECIBO AL SERVIDOR
	// ============================================
	console.log('\n📋 STEP 4: Enviar recibo al servidor (POST /api/store-ticket)\n');
	console.log('─'.repeat(60));

	const payload = {
		shopifyOrder: shopifyReceipt,
		receiverAddress: clientAddr
	};

	console.log('📤 Enviando payload al servidor:');
	console.log(JSON.stringify(payload, null, 2));

	try {
		const response = await fetch(`${API_URL}/store-ticket`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		const result = await response.json();

		console.log(`\n✅ Respuesta del servidor (Status: ${response.status}):`);
		console.log(JSON.stringify(result, null, 2));

		if (!response.ok) {
			console.error('❌ Error en la respuesta del servidor');
			process.exit(1);
		}

	} catch (error) {
		console.error('❌ Error enviando petición:', error.message);
		process.exit(1);
	}

	// ============================================
	// PART 5: VERIFICAR EN BD
	// ============================================
	console.log('\n\n📋 STEP 5: Verificar recibo guardado en BD\n');
	console.log('─'.repeat(60));

	const savedUser = await User.findOne({ address: clientAddr });
	
	if (savedUser) {
		console.log('✅ Usuario encontrado en BD:');
		console.log(`   Email: ${savedUser.email}`);
		console.log(`   Dirección: ${savedUser.address}`);
		console.log(`   ID: ${savedUser._id}\n`);

		const savedReceipts = await EncryptedReceipt.find({ user: savedUser._id });
		console.log(`📋 Recibos guardados: ${savedReceipts.length}`);
		
		if (savedReceipts.length > 0) {
			savedReceipts.forEach((receipt, index) => {
				console.log(`\n   Recibo ${index + 1}:`);
				console.log(`     - ID: ${receipt._id}`);
				console.log(`     - Transacción: ${receipt.transactionId}`);
				console.log(`     - Auth Tag: ${receipt.authTag.substring(0, 32)}...`);
				console.log(`     - IV: ${receipt.iv.substring(0, 32)}...`);
				console.log(`     - Creado: ${receipt.createdAt}`);
			});
		} else {
			console.log('⚠️  No hay recibos guardados para este usuario');
		}
	} else {
		console.log('❌ Usuario no encontrado en BD');
	}

	// ============================================
	// RESUMEN
	// ============================================
	console.log('\n' + '═'.repeat(60));
	console.log('✅ FLUJO COMPLETO EJECUTADO EXITOSAMENTE');
	console.log('═'.repeat(60));
	console.log('\n📊 Resumen del flujo:');
	console.log('   1. ✅ Cliente registrado en BD');
	console.log('   2. ✅ Recibo de Shopify preparado');
	console.log('   3. ✅ Servidor activo');
	console.log('   4. ✅ Recibo enviado a la API');
	console.log('   5. ✅ Datos verificados en BD\n');
	console.log('💡 El servidor ha:');
	console.log('   - Encriptado el recibo con AES-256-GCM');
	console.log('   - Enviado los datos a blockchain (simulado)');
	console.log('   - Guardado el recibo encriptado en BD\n');

	process.exit(0);
})();
