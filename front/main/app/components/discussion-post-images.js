import Ember from 'ember';

const {A, Component, computed} = Ember;

export default Component.extend({
	classNames: ['post-images'],

	/**
	 * @public
	 * @type {Ember.Array}
	 *
	 * Array containing images objects
	 */
	images: A(),

	/**
	 * @public
	 * @type {String}
	 *
	 * Component supports two modes:
	 * - 'compact' - shows only first image
	 * - 'full' - shows all images and displays image lightbox when image is clicked
	 */
	mode: 'compact',

	/**
	 * @private
	 */
	displayedImages: computed('showOnlyFirst', 'images', function () {
		const images = this.get('images'),
			noImages = A();

		return Ember.isEmpty(images) ? noImages : this.computeImagesToDisplay(images);
	}),

	computeImagesToDisplay(images) {
		return 'compact' === this.getWithDefault('mode', 'compact') ? images.slice(0, 1) : images;
	}
});
