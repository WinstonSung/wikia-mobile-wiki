// TODO after full rollout change path to REPO ROOT
const FastBootAppServer = require('fastboot-app-server');
const compression = require('compression');
const express = require('express');
const config = require('../../config/fastboot-server');
const logger = require('../logger');
const headers = require('../headers');
const heartbeat = require('../heartbeat');
const staticAssets = require('../static-assets');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');

function levelFn(status, err) {
	if (err || status >= 500) {
		// server internal error or error
		return 'error';
	} else if (status >= 400) {
		// client error
		return 'warn';
	}
	return 'info';
}

process.env.PORT = config.port;

const server = new FastBootAppServer({
	beforeMiddleware: (app) => {
		app.use(compression());
		app.use(logger);
		app.use(headers);
		/**
		 * Special handling for article-preview route.
		 * Fastboot doesn't support POST requests so we rewrite them on express to GET
		 * Additionally we have to enable POST body parser for this route to get data that was posted
		 */
		app.use('/article-preview', bodyParser.urlencoded({extended: true}));
		app.use('/article-preview', methodOverride(function() {
			return 'GET';
		}));
		app.use('/mobile-wiki', staticAssets);
		app.use('/heartbeat', heartbeat);
	},
	afterMiddleware: (app) => {
		app.use(function (err, req, res, next) {
			if (err) {
				// It should never get here
				// In theory, the Ember app handles all server errors
				const level = levelFn(res.statusCode, err);
				const logFn = req.log[level].bind(req.log);

				logFn(err);

				res.send('Server error');
			}
		});
	},
	distPath: config.distPath,
	gzip: true
});

server.start();
