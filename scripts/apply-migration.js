import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
	try {
		const filePath = path.join(__dirname, '../migrations/001_users_sessions.sql');
		const content = fs.readFileSync(filePath, 'utf8');

		// Split the SQL file by semicolons to execute queries one by one
		// This is safer when working with Neon Serverless SQL
		const queries = content
			.split(';')
			.map((q) => q.trim())
			.filter(Boolean);

		console.log(`Found ${queries.length} queries to execute.`);

		for (const query of queries) {
			console.log(`Executing: ${query.substring(0, 50).replace(/\n/g, ' ')}...`);
			await sql(query);
		}

		console.log('Migration applied successfully!');
		process.exit(0);
	} catch (err) {
		console.error('Migration failed:', err);
		process.exit(1);
	}
}

run();
