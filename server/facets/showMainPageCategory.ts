/// <reference path="../../typings/hapi/hapi.d.ts" />

import MainPage = require('../lib/MainPage');
import Utils = require('../lib/Utils');
import localSettings = require('../../config/localSettings');
import processCuratedContentData = require('./operations/processCuratedContentData');

function showCategory (request: Hapi.Request, reply: Hapi.Response): void {
	var wikiDomain: string = Utils.getCachedWikiDomainName(localSettings, request),
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
	mainPage.getWikiVariables((error: any, wikiVariables: any) => {
		if (error) {
			reply.redirect(localSettings.redirectUrlOnNoData);
		} else {
			mainPage.setTitle(wikiVariables.mainPageTitle);
			mainPage.getCategory(wikiVariables, (error: any, result: any = {}) => {
				processCuratedContentData(request, reply, error, result, allowCache);
			});
		}
	});
}

export = showCategory;
