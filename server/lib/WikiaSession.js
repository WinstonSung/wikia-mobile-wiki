/**
 * @typedef {Object} WhoAmIResponse
 * @property {string} [userId]
 * @property {number} [status]
 */
const Boom = require('boom'),
	Wreck = require('wreck'),
	localSettings = require('../../config/localSettings'),
	Logger = require('./Logger'),
	authUtils = require('./AuthUtils');

exports.WikiaSession = {
	/**
	 * @param {Hapi.Server} server
	 * @param {*} options
	 * @returns {*}
     */
	/* eslint no-unused-vars: 0 */
	scheme(server, options) {
		return {
			/**
			 * @param {*} request
			 * @param {*} reply
             * @returns {*}
             */
			authenticate: (request, reply) => {
				const accessToken = request.state.access_token,
					/**
					 * @param {*} err
					 * @param {*} response
                     * @param {string} payload
                     * @returns {*}
                     */
					callback = (err, response, payload) => {
						let parsed,
							parseError;

						try {
							parsed = JSON.parse(payload);
						} catch (e) {
							parseError = e;
						}

						// Detects an error with the connection
						if (err || parseError) {
							Logger.error('WhoAmI connection error: ', {
								err,
								parseError
							});
							return reply(Boom.unauthorized('WhoAmI connection error'));
						}

						if (parsed.status && parsed.status !== 200) {
							if (parsed.status === 401) {
								reply.unstate('access_token');
							}
							return reply(Boom.unauthorized('Token not authorized by WhoAmI'));
						}
						return reply.continue({credentials: {userId: parsed.userId}});
					};

				if (!accessToken) {
					return reply(Boom.unauthorized('No access_token'));
				}

				Wreck.get(
					authUtils.getWhoAmIUrl(),
					{
						timeout: localSettings.whoAmIService.timeout,
						headers: {
							Cookie: `access_token=${encodeURIComponent(accessToken)}`
						}
					},
					callback
				);
			}
		};
	}
};
