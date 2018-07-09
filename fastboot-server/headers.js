const onHeaders = require('on-headers');
const config = require('../config/fastboot-server');

let vendorAssetPath;

function setResponseTime(res) {
	const startAt = process.hrtime();

	onHeaders(res, () => {
		const diff = process.hrtime(startAt);
		const timeSec = (diff[0] * 1e3 + diff[1] * 1e-6) / 1000;

		res.setHeader('x-backend-response-time', timeSec.toFixed(3));
	});
}

module.exports = function (req, res, next) {
	res.set('x-served-by', process.env.HOST || process.env.HOSTNAME || 'mobile-wiki');
	// req_id is generated by express-bunyan-logger
	req.headers['x-trace-id'] = req.log.fields.req_id;
	if (req.headers['fastly-ssl']) {
		const cspPolicy = 'default-src https: \'self\' data: blob:; ' +
			'script-src https: \'self\' data: \'unsafe-inline\' \'unsafe-eval\' blob:; ' +
			'style-src https: \'self\' \'unsafe-inline\' blob:; '+
			'frame-ancestors https://*.' + config.servicesDomain + ';';
		const cspReport = `report-uri https://${config.servicesDomain}/csp-logger/csp`;
		res.setHeader('content-security-policy-report-only', cspPolicy + cspReport);
	}

	if (!vendorAssetPath) {
		try {
			vendorAssetPath = require('../dist/mobile-wiki/assets/assetMap.json').assets['assets/vendor.js'];
		} catch (exception) {
			vendorAssetPath = 'assets/vendor.js';
		}
	}

	if (!req.path.startsWith('/mobile-wiki-assets/assets')) {
		res.setHeader('link', `</mobile-wiki-assets/${vendorAssetPath}>; rel=preload; as=script`);
	}

	setResponseTime(res);
	next();
};
