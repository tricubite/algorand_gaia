import mongoose from 'mongoose';

const encryptedReceiptSchema = new mongoose.Schema({
	transactionId: {
		type: String,
		required: [true, 'El transactionId es obligatorio'],
		trim: false,
		unique: true
	},
	
	encryptedReceipt: {
		type: String,
		required: [true, 'El recibo encriptado es obligatorio'],
		trim: false
	},
	
	authTag: {
		type: String,
		required: true,
		trim: false
	},

	iv: {
		type: String,
		required: true,
		trim: false
	},
	
	user: { 
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'Un usuario es obligatorio']
	},

	createdAt: {
		type: Date,
		default: Date.now
	}
	
}, {
	timestamps: true,
	toJSON: { virtuals: true },
	toObject: { virtuals: true }
});

const EncryptedReceipt = mongoose.model('EncryptedReceipt', encryptedReceiptSchema);

export default EncryptedReceipt;
