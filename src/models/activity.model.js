import sql from '../config/db.js';

export const insert = async ({ action, componentId, actorUserId, actorEmail, actorRole, details }) => {
	const rows = await sql(
		`INSERT INTO activity_logs (entity, action, component_id, actor_user_id, actor_email, actor_role, details)
     VALUES ('component', $1, $2, $3, $4, $5, $6)
     RETURNING id, entity, action, component_id, actor_user_id, actor_email, actor_role, details, created_at`,
		[action, componentId ?? null, actorUserId ?? null, actorEmail ?? null, actorRole ?? null, details]
	);

	return rows[0];
};

export const list = async ({ componentId, action, startDate, endDate, limit, offset }) => {
	const filters = [];
	const params = [];

	if (componentId !== undefined) {
		params.push(componentId);
		filters.push(`component_id = $${params.length}`);
	}

	if (action) {
		params.push(action);
		filters.push(`action = $${params.length}`);
	}

	if (startDate) {
		params.push(startDate);
		filters.push(`created_at >= $${params.length}`);
	}

	if (endDate) {
		params.push(endDate);
		filters.push(`created_at <= $${params.length}`);
	}

	const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

	params.push(limit);
	const limitParam = `$${params.length}`;
	params.push(offset);
	const offsetParam = `$${params.length}`;

	const rows = await sql(
		`SELECT id, entity, action, component_id, actor_user_id, actor_email, actor_role, details, created_at
     FROM activity_logs
     ${whereClause}
     ORDER BY created_at DESC, id DESC
     LIMIT ${limitParam}
     OFFSET ${offsetParam}`,
		params
	);

	return rows;
};

export const count = async ({ componentId, action, startDate, endDate }) => {
	const filters = [];
	const params = [];

	if (componentId !== undefined) {
		params.push(componentId);
		filters.push(`component_id = $${params.length}`);
	}

	if (action) {
		params.push(action);
		filters.push(`action = $${params.length}`);
	}

	if (startDate) {
		params.push(startDate);
		filters.push(`created_at >= $${params.length}`);
	}

	if (endDate) {
		params.push(endDate);
		filters.push(`created_at <= $${params.length}`);
	}

	const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
	const [result] = await sql(`SELECT COUNT(*) AS total FROM activity_logs ${whereClause}`, params);

	return Number(result?.total ?? 0);
};
