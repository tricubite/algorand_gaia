import 'dotenv/config';
import express from 'express';
import connectDB from './config/database.js';
import shopifyRoutes from './routes/shopifyRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Conectar a MongoDB
await connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api', shopifyRoutes);

// Ruta raíz
app.get('/', (req, res) => {
	res.json({
		message: 'Algorand Shopify Integration Demo',
		version: '1.0.0',
		endpoints: {
			health: 'GET /api/health',
			storeTicket: 'POST /api/store-ticket'
		}
	});
});

// Manejo de errores global
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({
		success: false,
		error: err.message
	});
});

// Iniciar servidor
app.listen(PORT, () => {
	console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
	console.log(`📝 POST http://localhost:${PORT}/api/store-ticket - Enviar recibo de Shopify`);
	console.log(`✅ GET http://localhost:${PORT}/api/health - Verificar estado`);
});
