module.exports = (function () {
	const config = {
		distPath: 'dist/mobile-wiki',
		loggers: {
			syslog: 'error'
		},
		// 30 days in seconds
		staticAssetsTTL: 2.592e+6,
		port: 8001
	};

	if (process.env.WIKIA_ENVIRONMENT === 'dev') {
		config.loggers = {
			console: 'error'
		};
		config.port = 7001;
	}

	return config;
})();
