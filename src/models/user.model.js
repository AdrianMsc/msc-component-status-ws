import sql from '../config/db.js';

export const findByProviderSubject = async ({ provider, providerSubject }) => {
	const [user] = await sql(`SELECT * FROM users WHERE provider = $1 AND provider_subject = $2 LIMIT 1`, [
		provider,
		providerSubject
	]);
	return user;
};

export const upsertFromOidcProfile = async ({ provider, providerSubject, email, name, picture, role }) => {
	const rows = await sql(
		`INSERT INTO users (provider, provider_subject, email, name, picture, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (provider, provider_subject)
     DO UPDATE SET
       email = EXCLUDED.email,
       name = EXCLUDED.name,
       picture = EXCLUDED.picture,
       role = EXCLUDED.role,
       updated_at = now()
     RETURNING *`,
		[provider, providerSubject, email ?? null, name ?? null, picture ?? null, role ?? 'user']
	);

	return rows[0];
};

export const findById = async (id) => {
	const [user] = await sql(`SELECT * FROM users WHERE id = $1 LIMIT 1`, [id]);
	return user;
};
