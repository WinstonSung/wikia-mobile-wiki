import {computed} from '@ember/object';
import Service, {inject as service} from '@ember/service';
import Ads from '../modules/ads';
import logEvent from '../modules/event-logger';

export default Service.extend({
	module: Ads.getInstance(),
	wikiVariables: service(),
	currentUser: service(),
	siteHeadOffset: 0,
	noAdsQueryParam: null,
	noAds: computed('noAdsQueryParam', function () {
		return ['0', null, ''].indexOf(this.get('noAdsQueryParam')) === -1 || this.get('currentUser.isAuthenticated');
	}),
	adSlotComponents: null,

	init() {
		this._super(...arguments);
		this.adSlotComponents = {};
	},

	pushAdSlotComponent(slotName, adSlotComponent) {
		this.get('adSlotComponents')[slotName] = adSlotComponent;
	},

	destroyAdSlotComponents() {
		const adSlotComponents = this.get('adSlotComponents');

		Object.keys(adSlotComponents).forEach((slotName) => {
			const adSlot = adSlotComponents[slotName];
			if (!adSlot.get('isDestroyed')) {
				try {
					adSlot.destroy();
				} catch (e) {
					logEvent('destroyAdSlotComponents', {
						slotName,
						isDestroyed: adSlot.get('isDestroyed'),
						element: adSlot.element && adSlot.element.outerHTML
					});
				}
			}
		});

		this.set('adSlotComponents', {});
	}
});
