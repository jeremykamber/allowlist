import { STORAGE_KEYS } from '../shared/constants.js';

export class Analytics {
	constructor() {
		this._cache = null;
	}

	async getAnalytics() {
		if (this._cache) return this._cache;
		const data = await chrome.storage.local.get(STORAGE_KEYS.ANALYTICS);
		const analytics = data[STORAGE_KEYS.ANALYTICS] || {
			blockedAttempts: [],
			visitedAllowedSites: [],
		};
		this._cache = analytics;
		return analytics;
	}

	async trackBlockedSite(hostname) {
		const analytics = await this.getAnalytics();
		const now = Date.now();
		const today = new Date(now).toDateString();

		if (!analytics.blockedAttempts) analytics.blockedAttempts = [];
		const existing = analytics.blockedAttempts.find(a => a.hostname === hostname && a.date === today);
		if (existing) {
			existing.count++;
			existing.lastAttempt = now;
		} else {
			analytics.blockedAttempts.push({ hostname, date: today, count: 1, lastAttempt: now });
		}

		const cutoff = new Date(now - 90 * 24 * 60 * 60 * 1000).toDateString();
		analytics.blockedAttempts = analytics.blockedAttempts.filter(a => a.date >= cutoff);

		await chrome.storage.local.set({ [STORAGE_KEYS.ANALYTICS]: analytics });
		this._cache = analytics;
	}

	async trackAllowedSiteVisit(hostname, duration = 0) {
		const analytics = await this.getAnalytics();
		const now = Date.now();
		const today = new Date(now).toDateString();

		if (!analytics.visitedAllowedSites) analytics.visitedAllowedSites = [];
		const existing = analytics.visitedAllowedSites.find(a => a.hostname === hostname && a.date === today);
		if (existing) {
			existing.visits++;
			existing.totalTime += duration;
			existing.lastVisit = now;
		} else {
			analytics.visitedAllowedSites.push({
				hostname,
				date: today,
				visits: 1,
				totalTime: duration,
				lastVisit: now,
			});
		}

		const cutoff = new Date(now - 90 * 24 * 60 * 60 * 1000).toDateString();
		analytics.visitedAllowedSites = analytics.visitedAllowedSites.filter(a => a.date >= cutoff);

		await chrome.storage.local.set({ [STORAGE_KEYS.ANALYTICS]: analytics });
		this._cache = analytics;
	}

	async getAnalyticsSummary(days = 7) {
		const analytics = await this.getAnalytics();
		const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toDateString();

		const recentBlocked = (analytics.blockedAttempts || []).filter(a => a.date >= cutoff);
		const recentVisited = (analytics.visitedAllowedSites || []).filter(a => a.date >= cutoff);

		const topBlocked = recentBlocked
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		const topVisited = recentVisited
			.sort((a, b) => b.totalTime - a.totalTime)
			.slice(0, 10);

		const totalBlockedAttempts = recentBlocked.reduce((sum, a) => sum + a.count, 0);
		const totalVisits = recentVisited.reduce((sum, a) => sum + a.visits, 0);
		const totalTimeSpent = recentVisited.reduce((sum, a) => sum + a.totalTime, 0);

		const dailyBreakdown = {};
		recentBlocked.forEach(a => {
			if (!dailyBreakdown[a.date]) dailyBreakdown[a.date] = { blocked: 0, visited: 0, timeSpent: 0 };
			dailyBreakdown[a.date].blocked += a.count;
		});
		recentVisited.forEach(a => {
			if (!dailyBreakdown[a.date]) dailyBreakdown[a.date] = { blocked: 0, visited: 0, timeSpent: 0 };
			dailyBreakdown[a.date].visited += a.visits;
			dailyBreakdown[a.date].timeSpent += a.totalTime;
		});

		return {
			period: `Last ${days} days`,
			totalBlockedAttempts,
			totalVisits,
			totalTimeSpent,
			topBlocked,
			topVisited,
			dailyBreakdown: Object.entries(dailyBreakdown).sort(([a], [b]) => a.localeCompare(b)),
		};
	}

	async getTrends() {
		const analytics = await this.getAnalytics();
		const thisPeriod = this.getPeriodStats(analytics, 7, 0);
		const lastPeriod = this.getPeriodStats(analytics, 14, 7);

		const blockedDiff = thisPeriod.totalBlockedAttempts - lastPeriod.totalBlockedAttempts;
		const visitsDiff = thisPeriod.totalVisits - lastPeriod.totalVisits;
		const timeDiff = thisPeriod.totalTimeSpent - lastPeriod.totalTimeSpent;

		const blockedTrend = blockedDiff > 0 ? 'up' : blockedDiff < 0 ? 'down' : 'stable';
		const visitsTrend = visitsDiff > 0 ? 'up' : visitsDiff < 0 ? 'down' : 'stable';
		const timeTrend = timeDiff > 0 ? 'up' : timeDiff < 0 ? 'down' : 'stable';

		const dailyData = Object.entries(thisPeriod.dailyBreakdown || {}).sort(([a], [b]) => b.localeCompare(a));
		let streak = 0;
		const avgBlockedLastWeek = lastPeriod.totalBlockedAttempts / 7;
		for (const [, data] of dailyData) {
			if (data.blocked <= avgBlockedLastWeek * 1.2) {
				streak++;
			} else {
				break;
			}
		}

		const achievements = [];
		if (streak >= 3) achievements.push(`🔥 ${streak}-day focus streak`);
		if (thisPeriod.totalTimeSpent > lastPeriod.totalTimeSpent * 1.1) achievements.push('📈 Time focused up 10%+');
		if (thisPeriod.totalBlockedAttempts < lastPeriod.totalBlockedAttempts * 0.9) achievements.push('📉 Fewer distractions');
		if (thisPeriod.totalTimeSpent > 7 * 3600000) achievements.push('⏰ Over 7 hours focused');

		return {
			blockedTrend,
			blockedChange: Math.abs(blockedDiff),
			blockedChangePercent: lastPeriod.totalBlockedAttempts > 0 ? Math.round((blockedDiff / lastPeriod.totalBlockedAttempts) * 100) : 0,
			visitsTrend,
			visitsChange: Math.abs(visitsDiff),
			timeTrend,
			timeChange: Math.abs(timeDiff),
			timeChangePercent: lastPeriod.totalTimeSpent > 0 ? Math.round((timeDiff / lastPeriod.totalTimeSpent) * 100) : 0,
			streak,
			achievements,
		};
	}

	getPeriodStats(analytics, days, offset) {
		const now = Date.now();
		const start = new Date(now - (offset + days) * 24 * 60 * 60 * 1000).toDateString();
		const end = new Date(now - offset * 24 * 60 * 60 * 1000).toDateString();

		const blocked = (analytics.blockedAttempts || []).filter(a => a.date >= start && a.date <= end);
		const visited = (analytics.visitedAllowedSites || []).filter(a => a.date >= start && a.date <= end);

		const dailyBreakdown = {};
		blocked.forEach(a => {
			if (!dailyBreakdown[a.date]) dailyBreakdown[a.date] = { blocked: 0, visited: 0, timeSpent: 0 };
			dailyBreakdown[a.date].blocked += a.count;
		});
		visited.forEach(a => {
			if (!dailyBreakdown[a.date]) dailyBreakdown[a.date] = { blocked: 0, visited: 0, timeSpent: 0 };
			dailyBreakdown[a.date].visited += a.visits;
			dailyBreakdown[a.date].timeSpent += a.totalTime;
		});

		return {
			totalBlockedAttempts: blocked.reduce((sum, a) => sum + a.count, 0),
			totalVisits: visited.reduce((sum, a) => sum + a.visits, 0),
			totalTimeSpent: visited.reduce((sum, a) => sum + a.totalTime, 0),
			dailyBreakdown,
		};
	}
}
