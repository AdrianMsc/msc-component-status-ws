import * as ActivityModel from '../models/activity.model.js';

const ACTION_MAP = {
	create: 'component.created',
	update: 'component.updated',
	delete: 'component.deleted'
};

const MAX_DETAILS_SIZE = 20_000;

const normalizeAction = (action) => {
	if (!action) return null;
	if (ACTION_MAP[action]) return ACTION_MAP[action];
	if (Object.values(ACTION_MAP).includes(action)) return action;
	return null;
};

const safeDetails = (details) => {
	if (!details || typeof details !== 'object' || Array.isArray(details)) {
		return {};
	}

	const raw = JSON.stringify(details);
	if (raw.length <= MAX_DETAILS_SIZE) {
		return details;
	}

	return {
		truncated: true,
		size: raw.length,
		preview: raw.slice(0, MAX_DETAILS_SIZE)
	};
};

export const logComponentActivity = async ({ action, componentId, actor, details }) => {
	const normalizedAction = normalizeAction(action);
	if (!normalizedAction) {
		throw new Error('Invalid activity action.');
	}

	if (componentId !== null && componentId !== undefined && (!Number.isFinite(Number(componentId)) || Number(componentId) <= 0)) {
		throw new Error('Invalid component id for activity log.');
	}

	return ActivityModel.insert({
		action: normalizedAction,
		componentId: componentId ?? null,
		actorUserId: actor?.id ?? null,
		actorEmail: actor?.email ?? null,
		actorRole: actor?.role ?? null,
		details: safeDetails(details)
	});
};

export const getActivityHistory = async ({ componentId, action, startDate, endDate, page = 1, pageSize = 20 }) => {
	const normalizedAction = normalizeAction(action);
	if (action && !normalizedAction) {
		throw new Error('Invalid activity action filter.');
	}

	const safePage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
	const safePageSize = Number.isFinite(Number(pageSize)) && Number(pageSize) > 0 ? Math.min(Number(pageSize), 100) : 20;
	const offset = (safePage - 1) * safePageSize;

	const normalizedComponentId =
		componentId !== undefined && componentId !== null && componentId !== '' ? Number(componentId) : undefined;

	if (normalizedComponentId !== undefined && (!Number.isFinite(normalizedComponentId) || normalizedComponentId <= 0)) {
		throw new Error('Invalid activity component filter.');
	}

	const normalizedStartDate =
		startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? `${startDate}T00:00:00.000Z` : startDate || undefined;
	const normalizedEndDate =
		endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate) ? `${endDate}T23:59:59.999Z` : endDate || undefined;

	const [data, total] = await Promise.all([
		ActivityModel.list({
			componentId: normalizedComponentId,
			action: normalizedAction,
			startDate: normalizedStartDate,
			endDate: normalizedEndDate,
			limit: safePageSize,
			offset
		}),
		ActivityModel.count({
			componentId: normalizedComponentId,
			action: normalizedAction,
			startDate: normalizedStartDate,
			endDate: normalizedEndDate
		})
	]);

	return {
		data,
		pagination: {
			page: safePage,
			pageSize: safePageSize,
			total,
			totalPages: Math.max(1, Math.ceil(total / safePageSize))
		}
	};
};

export const ACTIVITY_ACTIONS = Object.values(ACTION_MAP);
