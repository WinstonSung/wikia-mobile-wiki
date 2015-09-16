/// <reference path="../../typings/hapi/hapi.d.ts" />
/// <reference path="../../typings/bluebird/bluebird.d.ts" />
/// <reference path="../../typings/mercury/mercury-server.d.ts" />
/// <reference path="../lib/Utils.ts" />

/**
 * @description Article controller
 * @TODO CONCF-761 ArticleRequestHelper and MainPageRequestHelper are sharing couple of functionalities.
 * Commoon part should be extracted and moved to new class WikiaRequestHelper(?)
 */
import util = require('util');
import Promise = require('bluebird');
import MediaWiki = require('./MediaWiki');
import Utils = require('./Utils');
import logger = require('./Logger');
import localSettings = require('../../config/localSettings');

export class ArticleRequestHelper {
	params: ArticleRequestParams;

	constructor(params: ArticleRequestParams) {
		this.params = params;
	}

	setTitle(title: string): void {
		this.params.title = title;
	}

	/**
	 * Handler for /article/{wiki}/{articleId} -- Currently calls to Wikia public JSON api for article:
	 * http://www.wikia.com/api/v1/#!/Articles
	 * This API is really not sufficient for semantic routes, so we'll need some what of retrieving articles by using the
	 * article slug name
	 *
	 * @param {Function} callback
	 * @param {boolean} getWikiVariables whether or not to make a WikiRequest to get information about the wiki
	 */
	getData(callback: Function, getWikiVariables: boolean = false): void {
		var requests = [
				new MediaWiki.ArticleRequest(this.params).article(this.params.title, this.params.redirect, this.params.sections)
			];

		logger.debug(this.params, 'Fetching article');

		if (getWikiVariables) {
			logger.debug({wiki: this.params.wikiDomain}, 'Fetching wiki variables');

			requests.push(new MediaWiki.WikiRequest({
				wikiDomain: this.params.wikiDomain
			}).getWikiVariables());
		}

		/**
		 * @see https://github.com/petkaantonov/bluebird/blob/master/API.md#settle---promise
		 *
		 * From Promise.settle documentation:
		 * Given an array, or a promise of an array, which contains promises (or a mix of promises and values)
		 * return a promise that is fulfilled when all the items in the array are either fulfilled or rejected.
		 * The fulfillment value is an array of PromiseInspection instances at respective positions in relation
		 * to the input array. This method is useful for when you have an array of promises and you'd like to know
		 * when all of them resolve - either by fulfilling of rejecting.
		 */
		Promise.settle(requests)
			.then((results: Promise.Inspection<Promise<any>>[]) => {
				var articlePromise: Promise.Inspection<Promise<any>> = results[0],
					wikiPromise: Promise.Inspection<Promise<any>> = results[1],
					article: any,
					wikiVariables: any = {};

				// if promise is fulfilled - use resolved value, if it's not - use rejection reason
				article = articlePromise.isFulfilled() ?
					articlePromise.value() :
					articlePromise.reason();

				if (getWikiVariables) {
					wikiVariables = wikiPromise.isFulfilled() ?
						wikiPromise.value() :
						wikiPromise.reason();
				}

				callback(article.exception, article.data, wikiVariables.data);
			});
	}

	/**
	 * Handle full page data generation
	 * @param {Function} next
	 */
	getFull(next: Function): void {
		this.getData((error: any, article: any, wikiVariables: any) => {
			next(error, {
				server: Utils.createServerData(localSettings, this.params.wikiDomain),
				wiki: wikiVariables || {},
				article: article || {}
			});
		}, true);
	}

	/**
	 * Get WikiVariables
	 */
	getWikiVariables(): any {
		var wikiRequest = new MediaWiki.WikiRequest(this.params);

		logger.debug(this.params, 'Fetching wiki variables');

		return wikiRequest.getWikiVariables();
	}

	/**
	 * Handle article page data generation, no need for WikiVariables
	 * @param {*} wikiVariables
	 * @param {Function} next
	 */
	getArticle(wikiVariables: any, next: Function): void {
		this.getData((error: any, article: any) => {
			next(error, {
				server: Utils.createServerData(localSettings, this.params.wikiDomain),
				wiki: wikiVariables || {},
				article: article || {}
			});
		}, false);
	}

	getArticleRandomTitle(next: Function): void {
		var articleRequest = new MediaWiki.ArticleRequest(this.params);

		articleRequest
			.randomTitle()
			.then((result: any): void => {
				var articleId: string,
					pageData: { pageid: number; ns: number; title: string };

				if (result.query && result.query.pages) {
					articleId = Object.keys(result.query.pages)[0];
					pageData = result.query.pages[articleId];

					next(null, {
						title: pageData.title
					});
				} else {
					next(result.error, null);
				}
			}, (error: any): void => {
				next(error, null);
			});
	}
}
