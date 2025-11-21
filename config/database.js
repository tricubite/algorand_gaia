import mongoose from 'mongoose';

const connectDB = async () => {
	try {
		const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/algorand-shopify';
		
		await mongoose.connect(mongoURI, {
			useNewUrlParser: true,
			useUnifiedTopology: true
		});

		console.log('✅ MongoDB conectado exitosamente');
		return mongoose.connection;

	} catch (error) {
		console.error('❌ Error conectando a MongoDB:', error.message);
		process.exit(1);
	}
};

export default connectDB;
