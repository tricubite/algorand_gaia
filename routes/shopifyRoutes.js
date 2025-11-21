import express from 'express';
import { storeTicketController } from '../controllers/ticketController.js';

const router = express.Router();

// Ruta POST para recibir recibos de Shopify
router.post('/store-ticket', storeTicketController);

// Ruta GET de prueba
router.get('/health', (req, res) => {
	res.json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

export default router;
