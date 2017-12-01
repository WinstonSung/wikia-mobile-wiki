import {computed} from '@ember/object';
import Component from '@ember/component';
import HeroImage from '../modules/hero-image';
import ViewportMixin from '../mixins/viewport';
import ImageLoader from '../mixins/image-loader';

export default Component.extend(
	ViewportMixin,
	ImageLoader,
	{
		isLoading: true,

		maxWidth: computed('viewportDimensions.width', function () {
			return Math.round(this.get('viewportDimensions.width') * 0.7);
		}),

		heroImageHelper: computed('heroImage', 'maxWidth', function () {
			const heroImage = this.get('heroImage'),
				maxWidth = this.get('maxWidth');

			return new HeroImage(heroImage, maxWidth);
		}),

		imageSrc: computed('isLoading', function () {
			if (this.get('isLoading')) {
				return `data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg' viewBox%3D'0 0 ${this.get('maxWidth')} ${this.get('heroImageHelper.computedHeight')}'%2F%3E`; // eslint-disable-line max-len
			}
			return this.get('heroImageHelper.thumbnailUrl');
		}),

		init() {
			this._super(...arguments);
			this.load(this.get('heroImageHelper.thumbnailUrl')).then(() => {
				this.set('isLoading', false);
			}).catch(() => {
				this.set('isLoading', false);
			});
		}
	}
);
