/// <reference path="../../typings/hapi/hapi.d.ts" />

import Logger = require('../lib/Logger');
import MainPage = require('../lib/MainPage');
import Utils = require('../lib/Utils');
import localSettings = require('../../config/localSettings');
import processCuratedContentData = require('./operations/processCuratedContentData');

function showCategory (request: Hapi.Request, reply: Hapi.Response): void {
	var wikiDomain: string = Utils.getCachedWikiDomainName(localSettings, request.headers.host),
		params: MainPageRequestParams = {
			categoryName: decodeURIComponent(request.params.categoryName),
			wikiDomain: wikiDomain
		},
		mainPage: MainPage.MainPageRequestHelper,
		allowCache = true;

	if (request.state.wikicities_session) {
		params.headers = {
			'Cookie': `wikicities_session=${request.state.wikicities_session}`
		};
		allowCache = false;
	}

	mainPage = new MainPage.MainPageRequestHelper(params);
	mainPage
		.getWikiVariables()
		.then((data: any) => {
			var wikiVariables = data.data;

			Utils.redirectToCanonicalHostIfNeeded(localSettings, request, reply, wikiVariables);

			mainPage.setTitle(wikiVariables.mainPageTitle);
			mainPage.getCategory(wikiVariables, (error: any, result: any = {}) => {
				processCuratedContentData(request, reply, error, result, allowCache);
			});
		})
		.catch(Utils.RedirectedToCanonicalHost, (): void => {
			Logger.info('Redirected to canonical host');
		})
		.catch((): void => {
			reply.redirect(localSettings.redirectUrlOnNoData);
		});
}

export = showCategory;
