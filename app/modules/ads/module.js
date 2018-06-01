import {Promise} from 'rsvp';
import adsSetup from './setup';
import adBlockDetection from './tracking/adblock-detection';
import videoAds from '../video-players/video-ads';

const SUPPORTED_SLOTS = [
	'mobile_top_leaderboard',
	'mobile_in_content',
	'mobile_prefooter',
	'bottom_leaderboard'
];

class Ads {
	constructor() {
		this.engine = null;
		this.events = null;
		this.instantGlobals = null;
		this.isLoaded = false;
		this.jwPlayerMoat = videoAds.jwPlayerMOAT;
		this.onReadyCallbacks = [];
		this.showAds = true;
	}

	static getInstance() {
		if (Ads.instance === null) {
			Ads.instance = new Ads();
		}
		return Ads.instance;
	}

	static loadGoogleTag() {
		window.M.loadScript('//www.googletagservices.com/tag/js/gpt.js', true);
	}

	init(mediaWikiAdsContext = {}) {
		if (!this.isLoaded) {
			this.getInstantGlobals()
				.then((instantGlobals) => {
					M.trackingQueue.push(() => this.setupAdEngine(mediaWikiAdsContext, instantGlobals));
				});
		}
	}

	setupAdEngine(mediaWikiAdsContext, instantGlobals) {
		const {events} = window.Wikia.adEngine;

		adsSetup.configure(mediaWikiAdsContext, instantGlobals);
		this.instantGlobals = instantGlobals;
		this.events = events;
		this.events.registerEvent('MENU_OPEN_EVENT');

		this.startAdEngine();

		this.isLoaded = true;
		this.onReadyCallbacks.forEach((callback) => callback());
		this.onReadyCallbacks = [];
	}

	startAdEngine() {
		if (this.showAds) {
			this.engine = adsSetup.init();
			Ads.loadGoogleTag();
		}
	}

	finishAtfQueue() {
		const {btfBlockerService} = window.Wikia.adEngine;

		if (this.showAds) {
			btfBlockerService.finishAboveTheFold();
		}
	}

	initJWPlayer(player, bidParams, slotTargeting) {
		if (this.showAds) {
			videoAds.init(player, {featured: true}, slotTargeting);
		}
	}

	getInstantGlobals() {
		return new Promise((resolve) => window.getInstantGlobals(resolve));
	}

	onReady(callback) {
		if (this.isLoaded) {
			callback();
		} else {
			this.onReadyCallbacks.push(callback);
		}
	}

	isSlotApplicable(slotName) {
		// TODO Handle incontent_boxad_X support

		return SUPPORTED_SLOTS.indexOf(slotName) !== -1;
	}

	getAdSlotComponentAttributes(slotName) {
		const {context} = window.Wikia.adEngine;

		const slotDefinition = context.get(`slots.${slotName}`);

		return {
			disableManualInsert: slotDefinition.disableManualInsert,
			isAboveTheFold: slotDefinition.aboveTheFold,
			name: slotName,
			hiddenClassName: 'hide'
		};
	}

	isArticleSectionCollapsed() {
		const {context} = window.Wikia.adEngine;

		return context.get('options.mobileSectionsCollapse');
	}

	pushSlotToQueue(slotName) {
		const {context} = window.Wikia.adEngine;

		context.push('state.adStack', {
			id: slotName
		});
	}

	onTransition(options) {
		const defaultOptions = {
			doNotDestroyGptSlots: true // allow mobile-wiki to destroy GPT slots on one's own
		};

		if (this.events) {
			this.events.pageChange(Object.assign(defaultOptions, options));
		}
	}

	afterTransition(mediaWikiAdsContext, instantGlobals) {
		this.instantGlobals = instantGlobals || this.instantGlobals;
		adBlockDetection.track();

		if (this.events) {
			this.events.pageRender({
				adContext: mediaWikiAdsContext,
				instantGlobals: this.instantGlobals
			});
		}
	}

	removeSlot(name) {
		const gptProvider = this.engine.getProvider('gpt');

		if (gptProvider) {
			gptProvider.destroySlots([name]);
		}
	}

	waitForReady() {
		return new Promise((resolve) => this.onReady(resolve));
	}

	onMenuOpen() {
		this.events.emit(this.events.MENU_OPEN_EVENT);
	}
}

Ads.instance = null;

export default Ads;
