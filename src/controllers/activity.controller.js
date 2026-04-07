import * as ActivityService from '../services/activity.service.js';

export const getComponentActivityHistory = async (req, res) => {
	try {
		const { componentId, action, startDate, endDate, page, pageSize } = req.query;

		const result = await ActivityService.getActivityHistory({
			componentId,
			action,
			startDate,
			endDate,
			page,
			pageSize
		});

		return res.status(200).json(result);
	} catch (error) {
		if (error.message?.includes('Invalid activity')) {
			return res.status(400).json({ error: error.message });
		}

		console.error('Error fetching activity history:', error);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
};
