import crypto from 'crypto';
import sodium from 'libsodium-wrappers';

export const ed25519Tox25519FromAccount = (generatedAccount, publicKey) => {
	const x25519PrivateKey = sodium.crypto_sign_ed25519_sk_to_curve25519(generatedAccount.sk);
	const x25519PublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(publicKey);
	return { x25519PrivateKey, x25519PublicKey };
};

export const ed25519Tox25519FromAddress = (publicKey) => {
	const x25519PublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(publicKey);
	return x25519PublicKey;
};

export const createKOKeysFromAccount = (x25519PrivateKey, x25519PublicKey) => {
	const KOPublicKey = crypto.createPublicKey({
		key: Buffer.concat([
			Buffer.from([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x03, 0x21, 0x00]),
			Buffer.from(x25519PublicKey)
		]),
		format: 'der',
		type: 'spki',
	});

	const KOPrivateKey = crypto.createPrivateKey({
		key: Buffer.concat([
			Buffer.from([0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x04, 0x22, 0x04, 0x20]),
			Buffer.from(x25519PrivateKey)
		]),
		format: 'der',
		type: 'pkcs8',
	});

	return { KOPrivateKey, KOPublicKey };
};

export const createKOKeysFromAddress = (x25519PublicKey) => {
	const KOPublicKey = crypto.createPublicKey({
		key: Buffer.concat([
			Buffer.from([0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x6e, 0x03, 0x21, 0x00]),
			Buffer.from(x25519PublicKey)
		]),
		format: 'der',
		type: 'spki',
	});

	return KOPublicKey;
};

export const getDHKeysFromAccount = (generatedAccount, publicKey) => {
	const { x25519PrivateKey, x25519PublicKey } = ed25519Tox25519FromAccount(generatedAccount, publicKey);
	const { KOPrivateKey, KOPublicKey } = createKOKeysFromAccount(x25519PrivateKey, x25519PublicKey);
	return { KOPrivateKey, KOPublicKey };
};

export const getDHKeysFromAddress = (publicKey) => {
	const x25519PublicKey = ed25519Tox25519FromAddress(publicKey);
	const KOPublicKey = createKOKeysFromAddress(x25519PublicKey);
	return KOPublicKey;
};

export const encryptAES256 = (secret, message) => {
	const derivedKey = crypto.createHmac('sha256', secret)
		.update('GAIA-session-key')
		.digest();
	const iv = crypto.randomBytes(12);

	const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
	let encryptedMsg = cipher.update(message, 'utf8', 'hex');
	encryptedMsg += cipher.final('hex');
	const authTag = cipher.getAuthTag();

	return { encryptedMsg, authTag, iv, derivedKey };
};
