import Logger from '../lib/logger';
import {CuratedMainPageRequestHelper, MainPageDataRequestError} from '../lib/curated-main-page';
import * as MediaWiki from '../lib/mediawiki';
import {getCachedWikiDomainName,
		redirectToCanonicalHostIfNeeded,
		RedirectedToCanonicalHost} from '../lib/utils';
import localSettings from '../../config/localSettings';
import prepareCuratedContentData from './operations/prepare-curated-content-data';
import showServerErrorPage from './operations/show-server-error-page';
import {disableCache, setResponseCaching, Interval as CachingInterval, Policy as CachingPolicy} from '../lib/caching';
import * as Tracking from '../lib/tracking';

const cachingTimes = {
	enabled: true,
	cachingPolicy: CachingPolicy.Public,
	varnishTTL: CachingInterval.standard,
	browserTTL: CachingInterval.disabled
};

/**
 * Handles article response from API
 *
 * @param {Hapi.Request} request
 * @param {Hapi.Response} reply
 * @param {MediaWikiPageData} data
 * @param {boolean} [allowCache=true]
 * @param {number} [code=200]
 *
 * @returns {void}
 */
function outputResponse(request, reply, data, allowCache = true, code = 200) {
	const result = prepareCuratedContentData(request, data);

	let response;

	// @todo XW-596 we shouldn't rely on side effects of this function
	Tracking.handleResponse(result, request);

	response = reply.view('application', result);
	response.code(code);
	response.type('text/html; charset=utf-8');

	if (allowCache) {
		return setResponseCaching(response, cachingTimes);
	}

	return disableCache(response);
}

/**
 *
 * @param {Hapi.Request} request
 * @param {Hapi.Response} reply
 * @returns {void}
 */
export default function showCuratedContent(request, reply) {
	const wikiDomain = getCachedWikiDomainName(localSettings, request),
		params = {wikiDomain};

	let mainPage,
		allowCache = true;

	if (request.state.wikicities_session) {
		params.headers = {
			Cookie: `wikicities_session=${request.state.wikicities_session}`
		};
		allowCache = false;
	}

	mainPage = new CuratedMainPageRequestHelper(params);

	mainPage.setTitle(request.params.title);
	mainPage.getWikiVariablesAndDetails()
		/**
		 * @param {CuratedContentPageData} data
		 * @returns {void}
		 */
		.then((data) => {
			redirectToCanonicalHostIfNeeded(localSettings, request, reply, data.wikiVariables);
			outputResponse(request, reply, data, allowCache);
		})
		/**
		 * @param {*} error
		 * @returns {void}
		 */
		.catch(MainPageDataRequestError, (error) => {
			outputResponse(request, reply, error.data, false);
		})
		/**
		 * @returns {void}
		 */
		.catch(MediaWiki.WikiVariablesRequestError, () => {
			showServerErrorPage(reply);
		})
		/**
		 * @returns {void}
		 */
		.catch(MediaWiki.WikiVariablesNotValidWikiError, () => {
			reply.redirect(localSettings.redirectUrlOnNoData);
		})
		/**
		 * @returns {void}
		 */
		.catch(RedirectedToCanonicalHost, () => {
			Logger.info('Redirected to canonical host');
		})
		/**
		 * @param {*} error
		 * @returns {void}
		 */
		.catch((error) => {
			Logger.fatal('Unhandled error, code issue', error);
			showServerErrorPage(reply);
		});
}
