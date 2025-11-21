import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import connectDB from './config/database.js';

const testUsers = [
	{
		email: 'user1@test.com',
		password: 'password123',
		address: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HVY'
	},
	{
		email: 'user2@test.com',
		password: 'password123',
		address: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBY5HVY'
	},
	{
		email: 'user3@test.com',
		password: 'password123',
		address: 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCY5HVY'
	}
];

async function seedUsers() {
	try {
		await connectDB();
		
		console.log('🗑️  Limpiando usuarios existentes de prueba...');
		await User.deleteMany({ email: { $in: testUsers.map(u => u.email) } });

		console.log('➕ Creando usuarios de prueba...\n');

		for (const userData of testUsers) {
			const user = new User(userData);
			await user.save();
			console.log(`✅ Usuario creado:`);
			console.log(`   Email: ${user.email}`);
			console.log(`   Address: ${user.address}`);
			console.log(`   ID: ${user._id}\n`);
		}

		console.log('═'.repeat(50));
		console.log('✅ Usuarios de prueba creados exitosamente');
		console.log('═'.repeat(50));
		console.log('\n📝 Usa cualquiera de estas direcciones en los tests:');
		testUsers.forEach((user, index) => {
			console.log(`   ${index + 1}. ${user.address}`);
		});

		process.exit(0);

	} catch (error) {
		console.error('❌ Error al crear usuarios:', error.message);
		process.exit(1);
	}
}

seedUsers();
