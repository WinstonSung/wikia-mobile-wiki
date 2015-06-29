/// <reference path="../app.ts" />
/// <reference path="../mixins/AdsMixin.ts" />

'use strict';

App.MainPageComponent = Em.Component.extend(App.AdsMixin, App.TrackClickMixin, {
	classNames: ['main-page-modules', 'main-page-body', 'mw-content'],
	tagName: 'section',

	featuredContentComponentVariation: Em.computed(function (): string {
		var experimentIds = {
				prod: '3079180094',
				dev: '3054131385'
			},
			variationNumber = Mercury.Utils.VariantTesting.getExperimentVariationNumber(experimentIds);

		switch (variationNumber) {
			case 1:
				return 'featured-content-variation-1';
			case 2:
				return 'featured-content-variation-2';
			case 3:
				return 'featured-content-variation-3';
			default:
				return 'featured-content';
		}
	}),

	actions: {
		openLightbox: function (lightboxType: string, lightboxData: any): void {
			this.sendAction('openLightbox', lightboxType, lightboxData);
		},

		openCuratedContentItem: function (item: CuratedContentItem): void {
			this.sendAction('openCuratedContentItem', item);
		}
	},

	didInsertElement: function (): void {
		this.injectMainPageAds();
		this.setupAdsContext(this.get('adsContext'));
	}
});
