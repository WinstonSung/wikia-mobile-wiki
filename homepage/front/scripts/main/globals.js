/* eslint no-new: 0 */

let cachedData = {};

/**
 * @returns {void}
 */
export function loadGlobalData() {
	return $.get('/globals', (data) => cachedData = data);
}

/**
 * @returns {string|null}
 */
export function getLoginUrl() {
	return cachedData ? cachedData.loginUrl : null;
}

/**
 * @returns {number}
 */
export function getMobileBreakpoint() {
	return cachedData ? cachedData.mobileBreakpoint : 710;
}

/**
 * @returns {number}
 */
export function getOptimizelyId() {
	return cachedData ? cachedData.googleSearchOptimizelyId : 0;
}
