define('mobile-wiki/components/portable-infobox-image-collection', ['exports', 'mobile-wiki/modules/thumbnailer', 'mobile-wiki/mixins/viewport'], function (exports, _thumbnailer, _viewport) {
	'use strict';

	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.default = Ember.Component.extend(_viewport.default, {
		classNames: ['pi-image-collection'],

		imageAspectRatio: 16 / 9,
		currentImageIndex: 0,

		currentImage: Ember.computed('items', 'currentImageIndex', function () {
			return this.get('items')[this.get('currentImageIndex')];
		}),

		collectionLength: Ember.computed.readOnly('items.length'),

		hasNextImage: Ember.computed('currentImageIndex', 'collectionLength', function () {
			return this.get('currentImageIndex') < this.get('collectionLength') - 1;
		}),

		hasPreviousImage: Ember.computed.gt('currentImageIndex', 0),

		cropMode: Ember.computed('currentImage', function () {
			var currentImage = this.get('currentImage');

			return currentImage.height > currentImage.width ? _thumbnailer.default.mode.topCropDown : _thumbnailer.default.mode.zoomCrop;
		}),

		computedWidth: Ember.computed.readOnly('viewportDimensions.width'),

		computedHeight: Ember.computed('currentImage', function () {
			var windowWidth = this.get('viewportDimensions.width'),
			    imageAspectRatio = this.get('imageAspectRatio'),
			    currentImage = this.get('currentImage'),
			    imageWidth = currentImage.width || windowWidth,
			    imageHeight = currentImage.height,
			    maxWidth = Math.floor(imageHeight * imageAspectRatio);

			var computedHeight = imageHeight;

			// wide image - image wider than 16:9 aspect ratio
			// Crop it to have 16:9 ratio.
			if (imageWidth > maxWidth) {
				return Math.floor(windowWidth / imageAspectRatio);
			}

			if (imageWidth > windowWidth) {
				computedHeight = Math.floor(windowWidth * (imageHeight / imageWidth));
			}

			// high image - image higher than square
			if (windowWidth < computedHeight) {
				return windowWidth;
			}

			return computedHeight;
		}),

		actions: {
			openLightbox: function openLightbox(galleryRef) {
				// openLightbox is set in getAttributesForMedia() inside utils/article-media.js
				this.get('openLightbox')(this.get('currentImage.ref'), galleryRef);
			},

			/**
    * @param {Number} direction - 1 for next or -1 for previous
    * @returns {void}
    */
			switchImage: function switchImage(direction) {
				var currentImageIndex = this.get('currentImageIndex'),
				    newImageIndex = currentImageIndex + direction;

				this.set('currentImageIndex', newImageIndex);
			}
		}
	});
});