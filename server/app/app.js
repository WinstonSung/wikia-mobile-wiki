import {setResponseCaching, Policy, Interval} from './lib/caching';
import Logger from './lib/logger';
import {Environment} from './lib/utils';
import wikiaSessionScheme from './lib/wikia-session';
import localSettings from '../config/localSettings';
import {routes} from './routes';
import cluster from 'cluster';
import fs from 'fs';
import h2o2 from 'h2o2';
import handlebars from 'handlebars';
import {Server} from 'hapi';
import i18next from 'hapi-i18next';
import inert from 'inert';
import path from 'path';
import url from 'url';
import vision from 'vision';

/* eslint no-process-env: 0 */

/**
 * NewRelic is only enabled on one server and that logic is managed by chef,
 * which passes it to our config
 */
if (process.env.NEW_RELIC_ENABLED === 'true') {
	require('newrelic');
}

const isDevbox = localSettings.environment === Environment.Dev,
	localesPath = path.join(__dirname, '..', '..', 'front/common/locales'),
	server = new Server({
		connections: {
			router: {
				stripTrailingSlash: true
			}
		}
	});

// Counter for maxRequestPerChild
let counter = 1,
	plugins;

/**
 * Create new onPreResponseHandler
 *
 * @param {boolean} isDevbox
 * @returns {function (Hapi.Request, Function): void}
 */
function getOnPreResponseHandler(isDevbox) {
	/**
	 * @param {Hapi.Request} request
	 * @param {*} reply
	 * @returns {void}
	 */
	return (request, reply) => {
		const response = request.response,
			responseTimeSec = ((Date.now() - request.info.received) / 1000).toFixed(3),
			servedBy = localSettings.host || 'mercury';

		// Assets on devbox must not be cached
		// Variety `file` means response was generated by reply.file() e.g. the directory handler
		if (!isDevbox && response.variety === 'file') {
			setResponseCaching(response, {
				enabled: true,
				cachingPolicy: Policy.Public,
				varnishTTL: Interval.long,
				browserTTL: Interval.long
			});
		}

		if (response && response.header) {
			response.header('x-backend-response-time', responseTimeSec);
			response.header('x-served-by', servedBy);

			if (response.variety !== 'file') {
				response.vary('cookie');
			}

			// https://www.maxcdn.com/blog/accept-encoding-its-vary-important/
			// https://www.fastly.com/blog/best-practices-for-using-the-vary-header
			response.vary('accept-encoding');
		} else if (response.isBoom) {
			// see https://github.com/hapijs/boom
			response.output.headers['x-backend-response-time'] = responseTimeSec;
			response.output.headers['x-served-by'] = servedBy;

			// TODO check if this makes sense together with server.on('request-internal')
			Logger.error({
				message: response.message,
				code: response.output.statusCode,
				headers: response.output.headers
			}, 'Response is Boom object');
		}

		reply.continue();
	};
}

/**
 * Setup logging for Hapi events
 *
 * @param {Hapi.Server} server
 * @returns {void}
 */
function setupLogging(server) {
	/**
	 * Emitted whenever an Internal Server Error (500) error response is sent. Single event per request.
	 *
	 * @param {Hapi.Request} request
	 * @param {Error} err
	 * @returns {void}
	 */
	server.on('request-error', (request, err) => {
		Logger.error({
			wiki: request.headers.host,
			text: err.message,
			url: url.format(request.url),
			referrer: request.info.referrer
		}, 'Internal server error');
	});
	/**
	 * Request events generated internally by the framework (multiple events per request).
	 *
	 * @param {Hapi.Request} request
	 * @param {*} event
	 * @param {*} tags
	 * @returns {void}
	 */
	server.on('request-internal', (request, event, tags) => {
		// We exclude implementation tag because it would catch the same error as request-error
		// but without message explaining what exactly happened
		if (tags.error && !tags.implementation) {
			Logger.error({
				wiki: request.headers.host,
				url: url.format(request.url),
				referrer: request.info.referrer,
				eventData: event.data,
				eventTags: tags
			}, 'Internal error');
		}
	});

	/**
	 * Emitted after a response to a client request is sent back. Single event per request.
	 *
	 * @param {Hapi.Request} request
	 * @returns {void}
	 */
	server.on('response', (request) => {
		// If there is an error and headers are not present, set the response time to -1 to make these
		// errors easy to discover
		let responseTime = -1;

		if (request.response.headers &&	request.response.headers.hasOwnProperty('x-backend-response-time')) {
			responseTime = parseFloat(request.response.headers['x-backend-response-time']);
		}

		Logger.info({
			wiki: request.headers.host,
			code: request.response.statusCode,
			url: url.format(request.url),
			userAgent: request.headers['user-agent'],
			responseTime,
			referrer: request.info.referrer
		}, 'Response');
	});
}

/**
 * Get list of supported languages based on locales directories
 *
 * @returns {string[]}
 */
function getSupportedLangs() {
	return fs.readdirSync(localesPath);
}

setupLogging(server);

server.connection({
	host: localSettings.host,
	port: localSettings.port,
	routes: {
		state: {
			failAction: 'log'
		}
	}
});

plugins = [
	{
		register: i18next,
		options: {
			i18nextOptions: {
				resGetPath: path.join(localesPath, '/__lng__/__ns__.json'),
				ns: {
					namespaces: ['main', 'auth', 'discussion'],
					defaultNs: 'main'
				},
				fallbackLng: 'en',
				supportedLngs: getSupportedLangs(),
				useCookie: false,
				detectLngFromHeaders: false,
				detectLngFromQueryString: true,
				detectLngQS: 'uselang',
				lowerCaseLng: true
			}
		}
	},
	{
		register: h2o2
	},
	{
		register: inert
	},
	{
		register: vision
	}
];

/**
 * This has to run after server.connection
 *
 * @param {*} err
 * @returns {void}
 */
server.register(plugins, (err) => {
	if (err) {
		Logger.error(err);
	}

	server.views({
		engines: {
			hbs: handlebars
		},
		isCached: true,
		layout: 'ember-main',
		helpersPath: path.join(__dirname, 'views', '_helpers'),
		layoutPath: path.join(__dirname, 'views', '_layouts'),
		path: path.join(__dirname, 'views'),
		partialsPath: path.join(__dirname, 'views', '_partials'),
		context: {
			i18n: {
				translateWithCache: server.methods.i18n.translateWithCache,
				getInstance: server.methods.i18n.getInstance
			}
		}
	});

	// Initialize cookies
	server.state('access_token', {
		isHttpOnly: true,
		clearInvalid: true,
		domain: localSettings.authCookieDomain
	});
});

server.auth.scheme('wikia', wikiaSessionScheme);
server.auth.strategy('session', 'wikia');

// instantiate routes
server.route(routes);

server.ext('onPreResponse', getOnPreResponseHandler(isDevbox));

/**
 * This is the earliest place where we can detect that the request URI was malformed
 * (decodeURIComponent failed in hapijs/call lib and 'badrequest' method was set as a special route handler).
 *
 * When MediaWiki gets request like that it redirects to the main page with code 301.
 *
 * For now we don't want to send additional request to get title of the main page
 * and are redirecting to / which causes user to get the main page eventually.
 *
 * @param {Hapi.Request} request
 * @param {*} reply
 * @returns {*}
 */
server.ext('onPreAuth', (request, reply) => {
	if (request.route.method === 'badrequest') {
		return reply.redirect('/').permanent(true);
	}
	return reply.continue();
});

/**
 * @returns {void}
 */
server.on('tail', () => {
	counter++;

	if (counter >= localSettings.maxRequestsPerChild) {
		// This is a safety net for memory leaks
		// It restarts child so even if it leaks we are 'safe'
		/**
		 * @returns {void}
		 */
		server.stop({
			timeout: localSettings.backendRequestTimeout
		}, () => {
			Logger.info('Max request per child hit: Server stopped');
			cluster.worker.kill();
		});
	}
});

/**
 * @param {string} msg
 * @returns {void}
 */
process.on('message', (msg) => {
	if (msg === 'shutdown') {
		/**
		 * @returns {void}
		 */
		server.stop({
			timeout: localSettings.workerDisconnectTimeout
		}, () => {
			Logger.info('Server stopped');
		});
	}
});

if (!module.parent) {
	/**
	 * @returns {void}
	 */
	server.start(() => {
		Logger.info({url: server.info.uri}, 'Server started');
		process.send('Server started');
	});
}

module.exports = server;
