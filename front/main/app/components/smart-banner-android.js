import Ember from 'ember';
import {track as mercuryTrack, trackActions} from 'common/utils/track';
import {system, standalone} from 'common/utils/browser';

/**
 * Component for a custom Smart Banner
 * it's visible only for Android devices
 * iOS has its own native smart banner - no need to render it there
 */
export default Ember.Component.extend({
	classNames: ['smart-banner-android'],
	classNameBindings: ['noIcon'],

	options: {
		// Language code for App Store
		appStoreLanguage: 'us',

		// Duration to hide the banner after close button is clicked (0 = always show banner)
		daysHiddenAfterClose: 15,

		// Duration to hide the banner after it is clicked (0 = always show banner)
		daysHiddenAfterView: 30,
	},
	day: 86400000,

	appId: Ember.computed.oneWay(`config.appId.android`),
	appScheme: Ember.computed.oneWay(`config.appScheme.android`),
	config: Ember.getWithDefault(Mercury, 'wiki.smartBanner', {}),
	dbName: Ember.get(Mercury, 'wiki.dbName'),
	description: Ember.computed.oneWay('config.description'),
	icon: Ember.computed.oneWay('config.icon'),

	iconStyle: Ember.computed('icon', function () {
		return new Ember.Handlebars.SafeString(`background-image: url(${this.get('icon')})`);
	}),

	link: Ember.computed('appId', 'dbName', function () {
		return `https://play.google.com/store/apps/details?id=${this.get('appId')}` +
				`&referrer=utm_source%3Dwikia%26utm_medium%3Dsmartbanner%26utm_term%3D${this.get('dbName')}`;
	}),

	noIcon: Ember.computed.not('icon'),
	title: Ember.computed.oneWay('config.name'),

	actions: {
		/**
		 * @returns {void}
		 */
		close() {
			this.setSmartBannerCookie(this.get('options.daysHiddenAfterClose'));
			this.sendAction('toggleVisibility', false);
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

			this.sendAction('toggleVisibility', false);
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
		Ember.run.scheduleOnce('afterRender', this, this.checkForHiding);
	},

	/**
	 * @returns {void}
	 */
	checkForHiding() {
		const {name, disabled} = this.get('config');

		// Show custom smart banner only when a device is Android
		// website isn't loaded in app and user did not dismiss it already
		if (system === 'android' && !standalone && name && !disabled && Ember.$.cookie('sb-closed') !== '1') {
			this.sendAction('toggleVisibility', true);
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

		Ember.run.later(this, this.fallbackToStore, 300);
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
		mercuryTrack({
			action,
			category: 'smart-banner',
			label: this.get('dbName')
		});
	},
});
