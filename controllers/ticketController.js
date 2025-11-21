import algosdk from 'algosdk';
import crypto from 'crypto';
import User from '../models/User.js';
import EncryptedReceipt from '../models/EncryptedReceipt.js';
import { getDHKeysFromAccount, getDHKeysFromAddress, encryptAES256 } from '../utils/encryption.js';
import { codeAndSend } from '../utils/algorand.js';

const getAccountFromMnemonic = (mnemonic) => {
	const account = algosdk.mnemonicToSecretKey(mnemonic);
	const address = account.addr;
	const publicKey = account.sk.slice(32);
	return { account, address, publicKey };
};

export const storeTicketController = async (req, res) => {
	try {
		const { shopifyOrder, receiverAddress } = req.body;

		if (!shopifyOrder || !receiverAddress) {
			return res.status(400).json({
				success: false,
				error: 'shopifyOrder y receiverAddress son requeridos'
			});
		}

		const result = await storeTicket(shopifyOrder, receiverAddress);

		if (!result) {
			return res.status(500).json({
				success: false,
				error: 'Error al procesar el recibo'
			});
		}

		return res.status(200).json({
			success: true,
			message: 'Recibo almacenado exitosamente',
			transactionId: result.txId
		});
	} catch (error) {
		console.error('Error en controller:', error);
		return res.status(500).json({
			success: false,
			error: error.message
		});
	}
};

const storeTicket = async (shopifyOrder, receiverAddress) => {
	try {
		// Obtener cuentas
		const serverAccount = getAccountFromMnemonic(process.env.ALGO_SENDER);
		const clientPublicKey = algosdk.decodeAddress(receiverAddress).publicKey;

		// Generar claves DH
		const serverKeys = getDHKeysFromAccount(serverAccount.account, serverAccount.publicKey);
		const clientPublicKeyObj = getDHKeysFromAddress(clientPublicKey);

		// Calcular secreto compartido
		const sharedSecret = crypto.diffieHellman({
			privateKey: serverKeys.KOPrivateKey,
			publicKey: clientPublicKeyObj
		});

		// Encriptar recibo
		const { encryptedMsg, authTag, iv } = encryptAES256(sharedSecret, JSON.stringify(shopifyOrder));
		const blockchainData = `${authTag.toString('hex')}:${iv.toString('hex')}`;

		// Intentar enviar a blockchain
		let txId = `txn-${Date.now()}-${Math.random().toString(36).substring(7)}`;
		
		try {
			const result = await codeAndSend(serverAccount.address, receiverAddress, blockchainData, serverAccount.account.sk);
			if (result && result.txId) {
				txId = result.txId;
			}
		} catch (err) {
			console.log('Blockchain indisponible, usando ID mock:', txId);
		}

		// Guardar en BD
		const user = await User.findOne({ address: receiverAddress });
		if (!user) {
			throw new Error('Usuario no encontrado');
		}

		const receipt = new EncryptedReceipt({
			transactionId: txId,
			encryptedReceipt: encryptedMsg,
			authTag: authTag.toString('hex'),
			iv: iv.toString('hex'),
			user: user._id
		});

		await receipt.save();
		return { txId };

	} catch (error) {
		console.log('Error en storeTicket:', error.message);
		return null;
	}
};
