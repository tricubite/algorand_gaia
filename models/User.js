import mongoose from 'mongoose';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
	email: {
		type: String,
		required: [true, 'El email es obligatorio'],
		unique: true,
		trim: true,
		lowercase: true
	},
	password: {
		type: String,
		required: [true, 'La contraseña es obligatoria'],
		minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
		select: false // No incluir en las consultas por defecto
	},
	isActive: {
		type: Boolean,
		default: true
	},
	
	lastLogin: {
		type: Date,
		default: null
	},

	address: {
		type: String,
		required: [true, 'La dirección de Algorand es obligatoria'],
		unique: true,
		trim: true,
		select: false
	},

	encryption_salt: {
		type: String,
		select: false
	},

	createdAt: {
		type: Date,
		default: Date.now
	}
});

userSchema.pre('save', async function(next) {
	if (!this.isModified('password')) return next();
	
	try {
		if (this.isNew) {
			this.encryption_salt = crypto.randomBytes(32).toString('hex');
		}

		next();
	} catch (error) {
		next(error);
	}
});

const User = mongoose.model('User', userSchema);

export default User;
