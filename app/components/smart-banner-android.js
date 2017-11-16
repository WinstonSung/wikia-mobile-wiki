import {inject as service} from '@ember/service';
import {oneWay, reads, not} from '@ember/object/computed';
import $ from 'jquery';
import Component from '@ember/component';
import {get, computed} from '@ember/object';
import {htmlSafe} from '@ember/string';
import {run} from '@ember/runloop';
import Thumbnailer from '../modules/thumbnailer';
import {track, trackActions} from '../utils/track';
import {system, standalone} from '../utils/browser';

/**
 * Component for a custom Smart Banner
 * it's visible only for Android devices
 * iOS has its own native smart banner - no need to render it there
 */
export default Component.extend({
	classNames: ['smart-banner-android'],
	classNameBindings: ['noIcon'],

	wikiVariables: service(),
	smartBanner: service(),

	options: {
		// Language code for App Store
		appStoreLanguage: 'us',

		// Duration to hide the banner after close button is clicked (0 = always show banner)
		daysHiddenAfterClose: 15,

		// Duration to hide the banner after it is clicked (0 = always show banner)
		daysHiddenAfterView: 30,
	},
	day: 86400000,

	appId: oneWay(`config.appId.android`),
	appScheme: oneWay(`config.appScheme.android`),
	config: computed('wikiVariables', function () {
		return this.get('wikiVariables').get('smartBanner') || {};
	}),
	dbName: reads('wikiVariables.dbName'),
	description: oneWay('config.description'),
	icon: oneWay('config.icon'),
	iconSize: 92,

	iconStyle: computed('icon', function () {
		if (this.get('noIcon')) {
			return null;
		}

		const icon = Thumbnailer.getThumbURL(this.get('icon'), {
			mode: Thumbnailer.mode.thumbnailDown,
			width: this.iconSize,
			height: this.iconSize
		});

		return htmlSafe(`background-image: url(${icon})`);
	}),

	link: computed('appId', 'dbName', function () {
		return `https://play.google.com/store/apps/details?id=${this.get('appId')}` +
			`&referrer=utm_source%3Dwikia%26utm_medium%3Dsmartbanner%26utm_term%3D${this.get('dbName')}`;
	}),

	noIcon: not('icon'),
	title: oneWay('config.name'),

	actions: {
		/**
		 * @returns {void}
		 */
		close() {
			this.setSmartBannerCookie(this.get('options.daysHiddenAfterClose'));
			this.get('smartBanner').setVisibility(false);
			this.track(trackActions.close);
		},

		/**
		 * @returns {void}
		 */
		view() {
			const appScheme = this.get('appScheme');

			this.setSmartBannerCookie(this.get('options.daysHiddenAfterView'));

			if (appScheme) {
				this.tryToOpenApp(appScheme);
			} else {
				window.open(this.get('link'), '_blank');
			}

			this.get('smartBanner').setVisibility(false);
		},
	},

	/**
	 * @param {MouseEvent} event
	 * @returns {void}
	 */
	click(event) {
		const $target = this.$(event.target);

		if (!$target.is('.sb-close')) {
			this.send('view');
		}
	},

	/**
	 * @returns {void}
	 */
	willInsertElement() {
		// this HAVE TO be run while rendering, but it cannot be run on didInsert/willInsert
		// running this just after render is working too
		run.scheduleOnce('afterRender', this, this.checkForHiding);
	},

	/**
	 * @returns {void}
	 */
	checkForHiding() {
		const {name, disabled} = this.get('config');

		// Show custom smart banner only when a device is Android
		// website isn't loaded in app and user did not dismiss it already
		if (system === 'android' && !standalone && name && !disabled && $.cookie('sb-closed') !== '1') {
			this.get('smartBanner').setVisibility(true);
			this.track(trackActions.impression);
		}
	},

	/**
	 * Try to open app using custom scheme and if it fails go to fallback function
	 *
	 * @param {string} appScheme
	 * @returns {void}
	 */
	tryToOpenApp(appScheme) {
		this.track(trackActions.open);
		window.document.location.href = `${appScheme}://`;

		run.later(this, this.fallbackToStore, 300);
	},

	/**
	 * Open app store
	 *
	 * @returns {void}
	 */
	fallbackToStore() {
		this.track(trackActions.install);
		window.open(this.get('link'), '_blank');
	},

	/**
	 * Sets sb-closed=1 cookie for given number of days
	 *
	 * @param {number} days
	 * @returns {void}
	 */
	setSmartBannerCookie(days) {
		const date = new Date();

		date.setTime(date.getTime() + (days * this.get('day')));
		$.cookie('sb-closed', 1, {
			expires: date,
			path: '/'
		});
	},

	/**
	 * @param {string} action
	 * @returns {void}
	 */
	track(action) {
		track({
			action,
			category: 'smart-banner',
			label: this.get('dbName')
		});
	},
});
