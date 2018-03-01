import {inject as service} from '@ember/service';
import Route from '@ember/routing/route';
import {getOwner} from '@ember/application';
import {getWithDefault, get} from '@ember/object';
import Ember from 'ember';
import {isEmpty} from '@ember/utils';
import {run} from '@ember/runloop';
import ArticleModel from '../models/wiki/article';
import HeadTagsStaticMixin from '../mixins/head-tags-static';
import getLinkInfo from '../utils/article-link';
import ErrorDescriptor from '../utils/error-descriptor';
import {WikiVariablesRedirectError, DontLogMeError} from '../utils/errors';
import {disableCache, setResponseCaching, CachingInterval, CachingPolicy} from '../utils/fastboot-caching';
import {normalizeToUnderscore} from '../utils/string';
import {track, trackActions} from '../utils/track';
import {getQueryString} from '../utils/url';
import ApplicationModel from '../models/application';

export default Route.extend(
	Ember.TargetActionSupport,
	HeadTagsStaticMixin,
	{
		ads: service(),
		currentUser: service(),
		fastboot: service(),
		i18n: service(),
		lightbox: service(),
		logger: service(),
		wikiVariables: service(),
		smartBanner: service(),

		queryParams: {
			commentsPage: {
				replace: true
			},
			noexternals: {
				replace: true
			},
			uselang: {
				replace: true
			}
		},
		noexternals: null,

		model(params, transition) {
			const fastboot = this.get('fastboot');

			// We need the wiki page title for setting tracking dimensions in ApplicationModel.
			// Instead of waiting for the wiki page model to resolve,
			// let's just use the value from route params.
			let wikiPageTitle;

			if (transition.targetName === 'wiki-page') {
				wikiPageTitle = transition.params['wiki-page'].title;
			}

			return ApplicationModel.create(getOwner(this).ownerInjection())
				.fetch(wikiPageTitle, transition.queryParams.uselang)
				.then((applicationData) => {
					this.get('wikiVariables').setProperties(applicationData.wikiVariables);

					if (fastboot.get('isFastBoot')) {
						this.injectScriptsFastbootOnly(applicationData.wikiVariables, transition.queryParams);
					}

					return applicationData;
				})
				.catch((error) => {
					this.get('logger').warn(`wikiVariables error: ${error}`);
					if (error instanceof WikiVariablesRedirectError) {
						fastboot.get('response.headers').set(
							'location',
							error.additionalData[0].redirectLocation
						);
						fastboot.set('response.statusCode', 302);
					}

					throw error;
				});
		},

		afterModel(model, transition) {
			const fastboot = this.get('fastboot');

			this._super(...arguments);

			this.get('i18n').initialize(transition.queryParams.uselang || model.wikiVariables.language.content);

			if (
				!fastboot.get('isFastBoot') &&
				this.get('ads.adsUrl') &&
				!transition.queryParams.noexternals
			) {
				window.getInstantGlobal('wgSitewideDisableAdsOnMercury', (wgSitewideDisableAdsOnMercury) => {
					if (wgSitewideDisableAdsOnMercury) {
						return;
					}

					const adsModule = this.get('ads.module');

					adsModule.init(this.get('ads.adsUrl'));

					/*
					 * This global function is being used by our AdEngine code to provide prestitial/interstitial ads
					 * It works in similar way on Oasis: we call ads server (DFP) to check if there is targeted ad unit
					 * for a user.
					 * If there is and it's in a form of prestitial/interstitial the ad server calls our exposed JS function to
					 * display the ad in a form of modal. The ticket connected to the changes: ADEN-1834.
					 * Created lightbox might be empty in case of lack of ads, so we want to create lightbox with argument
					 * lightboxVisible=false and then decide if we want to show it.
					 */
					adsModule.createLightbox = (contents, closeButtonDelay, lightboxVisible) => {
						if (!closeButtonDelay) {
							closeButtonDelay = 0;
						}

						if (lightboxVisible) {
							this.get('lightbox').openLightbox('ads', {contents}, closeButtonDelay);
						} else {
							this.get('lightbox').createHiddenLightbox('ads', {contents}, closeButtonDelay);
						}
					};

					// TODO: fix it when lightbox is refactored
					adsModule.showLightbox = () => {
						this.get('lightbox').showLightbox();
					};

					adsModule.setSiteHeadOffset = (offset) => {
						this.set('ads.siteHeadOffset', offset);
					};

					adsModule.hideSmartBanner = () => {
						this.set('smartBanner.smartBannerVisible', false);
					};
				});
			}

			if (fastboot.get('isFastBoot')) {
				// https://www.maxcdn.com/blog/accept-encoding-its-vary-important/
				// https://www.fastly.com/blog/best-practices-for-using-the-vary-header
				fastboot.get('response.headers').set('vary', 'cookie,accept-encoding');
				fastboot.get('response.headers').set('Content-Language', model.wikiVariables.language.content);

				// TODO remove `transition.queryParams.page`when icache supports surrogate keys
				// and we can purge the category pages
				if (this.get('currentUser.isAuthenticated') || transition.queryParams.page) {
					disableCache(fastboot);
				} else {
					// TODO don't cache errors
					setResponseCaching(fastboot, {
						enabled: true,
						cachingPolicy: CachingPolicy.Public,
						varnishTTL: CachingInterval.standard,
						browserTTL: CachingInterval.disabled
					});
				}
			}
		},

		redirect(model) {
			const fastboot = this.get('fastboot'),
				basePath = model.wikiVariables.basePath;

			if (fastboot.get('isFastBoot')) {
				const protocol = fastboot.get('request.headers').get('fastly-ssl')
					? 'https:'
					: fastboot.get('request.protocol');
				const fastbootRequest = this.get('fastboot.request');

				if (basePath === `${protocol}//${model.wikiVariables.host}`) {
					return;
				}

				// PLATFORM-3351 - if x-wikia-wikiaappsid is present, allow https even if basePath is set to http.
				if (fastbootRequest.get('headers').get('x-wikia-wikiaappsid') &&
					basePath === `http://${model.wikiVariables.host}`
				) {
					return;
				}

				fastboot.get('response.headers').set(
					'location',
					`${basePath}${fastbootRequest.get('path')}`
				);
				fastboot.set('response.statusCode', 301);

				// TODO XW-3198
				// We throw error to stop Ember and redirect immediately
				throw new DontLogMeError();
			}
		},

		setupController(controller, model) {
			controller.set('model', model);

			if (!this.get('fastboot.isFastBoot')) {
				// Prevent scrolling to the top of the page after Ember is loaded
				// See https://github.com/dollarshaveclub/ember-router-scroll/issues/55#issuecomment-313824423
				const routerScroll = this.get('router.service');
				routerScroll.set('key', get(window, 'history.state.uuid'));
				routerScroll.update();

				run.scheduleOnce('afterRender', () => {
					const scrollPosition = routerScroll.get('position');
					window.scrollTo(scrollPosition.x, scrollPosition.y);
				});
			}
		},

		actions: {
			loading(transition) {
				if (this.controller) {
					this.controller.set('isLoading', true);
					transition.promise.finally(() => {
						this.controller.set('isLoading', false);
					});
				}
			},

			didTransition() {
				this.get('ads.module').onTransition();

				// Clear notification alerts for the new route
				this.controller.clearNotifications();
			},

			error(error, transition) {
				const fastboot = this.get('fastboot');

				// TODO XW-3198
				// Don't handle special type of errors. Currently we use them hack Ember and stop executing application
				if (error instanceof DontLogMeError) {
					return false;
				}

				this.get('logger').error('Application error', error);
				if (fastboot.get('isFastBoot')) {
					fastboot.get('shoebox').put('serverError', true);
					fastboot.set('response.statusCode', getWithDefault(error, 'code', 503));
					this.injectScriptsFastbootOnly(null, transition.queryParams);

					// We can't use the built-in mechanism to render error substates.
					// When FastBoot sees that application route sends error, it dies.
					// Instead, we transition to the error substate manually.
					const errorDescriptor = ErrorDescriptor.create({error});
					this.intermediateTransitionTo('application_error', errorDescriptor);
					return false;
				}

				return true;
			},

			/**
			 * @param {HTMLAnchorElement} target
			 * @returns {void}
			 */
			handleLink(target) {
				const currentRoute = this.router.get('currentRouteName');

				let title,
					trackingCategory,
					info;

				if (currentRoute === 'wiki-page') {
					title = this.controllerFor('wikiPage').get('model').get('title');
				} else {
					title = '';
				}

				trackingCategory = target.dataset.trackingCategory;
				info = getLinkInfo(
					this.get('wikiVariables.basePath'),
					title,
					target.hash,
					target.href,
					target.search
				);

				/**
				 * Handle tracking
				 */
				if (trackingCategory) {
					track({
						action: trackActions.click,
						category: trackingCategory
					});
				}

				/**
				 * handle links that are external to the application
				 */
				if (target.className.indexOf('external') > -1) {
					return window.location.assign(target.href);
				}

				if (info.article) {
					this.transitionTo('wiki-page', info.article + (info.hash ? info.hash : ''));
				} else if (info.url) {
					/**
					 * If it's a jump link or a link to something in a Wikia domain, treat it like a normal link
					 * so that it will replace whatever is currently in the window.
					 * TODO: this regex is alright for dev environment, but doesn't work well with production
					 */
					if (info.url.charAt(0) === '#' || info.url.match(/^https?:\/\/.*\.wikia(-.*)?\.com.*\/.*$/)) {
						window.location.assign(info.url);
					} else {
						window.open(info.url);
					}
				} else {
					// Reaching this clause means something is probably wrong.
					this.get('logger').error('Unable to open link', target.href);
				}
			},

			/**
			 * @returns {void}
			 */
			loadRandomArticle() {
				this.get('controller').send('toggleDrawer', false);

				ArticleModel.create(getOwner(this).ownerInjection())
					.getArticleRandomTitle()
					.then((articleTitle) => {
						this.transitionTo('wiki-page', encodeURIComponent(normalizeToUnderscore(articleTitle)));
					})
					.catch((err) => {
						this.send('error', err);
					});
			},

			openNav() {
				this.get('controller').setProperties({
					drawerContent: 'nav',
					drawerVisible: true
				});
			}
		},

		injectScriptsFastbootOnly(wikiVariables, queryParams) {
			this._super(...arguments);

			if (!this.get('fastboot.isFastBoot')) {
				return;
			}

			// Render components into FastBoot's HTML, outside of the Ember app so they're not touched when Ember starts
			const applicationInstance = getOwner(this);
			const document = applicationInstance.lookup('service:-document');
			const bodyBottomComponent = applicationInstance.lookup('component:fastboot-only/body-bottom');

			bodyBottomComponent.appendTo(document.body);
		}
	}
);
