import algosdk from 'algosdk';

// Configuración de Algorand
const algodToken = '';
const algodServerApi = 'https://testnet-api.algonode.cloud';
const algodPort = '';

export const codeAndSend = async (sender, receiver, metadata, signerKey) => {
	try {
		const algodClient = new algosdk.Algodv2(algodToken, algodServerApi, algodPort);
		let params = await algodClient.getTransactionParams().do();
		const note = algosdk.encodeObj(metadata);
		const sizeInBytes = note.length;
		let amount = 0;
		let closeout = undefined;

		if (sizeInBytes < 1024) {
			let txn = algosdk.makePaymentTxnWithSuggestedParams(sender, receiver, amount, closeout, note, params);
			const signedTxn = txn.signTxn(signerKey);
			const txId = await algodClient.sendRawTransaction(signedTxn).do();
			return txId;
		} else {
			function trocearArray(arrayOriginal, restoDatos) {
				const arrayDividido = [];
				const maxBytes = 950;
				let segmento = [arrayOriginal[0]];

				for (const elemento of arrayOriginal.slice(1)) {
					const newEncodeData = { restoDatos, segmento };
					const bytesElemento = (algosdk.encodeObj(elemento)).length;
					const actualEncode = algosdk.encodeObj(newEncodeData);
					let InBytes = actualEncode.length;

					if (InBytes + bytesElemento <= maxBytes) {
						segmento.push(elemento);
						InBytes += bytesElemento;
					} else {
						arrayDividido.push(segmento);
						segmento = [elemento];
					}
				}

				if (segmento.length > 0) {
					arrayDividido.push(segmento);
				}
				return arrayDividido;
			}

			const arrayOriginal = metadata.newCompras;
			const arraysPartidos = trocearArray(arrayOriginal, metadata.newTicket);
			const txArray = [];

			arraysPartidos.forEach(newAtomicPurchase => {
				const newTicket = metadata.newTicket;
				let newMetadata = { newTicket, newAtomicPurchase };
				let notePart = algosdk.encodeObj(newMetadata);
				let txn = algosdk.makePaymentTxnWithSuggestedParams(sender, receiver, amount, closeout, notePart, params);
				txArray.push(txn);
			});

			const arrayID = algosdk.assignGroupID(txArray);
			const signedArray = arrayID.map(element => element.signTxn(signerKey));
			const txId = await algodClient.sendRawTransaction(signedArray).do();
			return txId;
		}
	} catch (error) {
		console.error('Error in codeAndSend:', error);
		return null;
	}
};
