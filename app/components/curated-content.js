import Component from '@ember/component';
import $ from 'jquery';

export default Component.extend({
	classNames: ['curated-content', 'mw-content'],
	activeLabel: null,

	actions: {
		/**
		 * @param {CuratedContentItem} item
		 * @returns {void}
		 */
		openSection(item) {
			const navHeight = $('.site-head-container').outerHeight(),
				scrollTop = this.$().offset().top - navHeight;

			this.set('activeLabel', item.label);
			$('html, body').animate({scrollTop});
		},

		closeSection() {
			this.set('activeLabel', null);
		}
	}
});
