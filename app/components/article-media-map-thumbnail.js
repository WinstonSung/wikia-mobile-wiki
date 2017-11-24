import {inject as service} from '@ember/service';
import Component from '@ember/component';
import {track, trackActions} from '../utils/track';
import RenderComponentMixin from '../mixins/render-component';

export default Component.extend(RenderComponentMixin, {
	classNames: ['article-media-map-thumbnail'],
	tagName: 'figure',
	logger: service(),

	/**
	 * @returns {void|boolean}
	 */
	click() {
		const url = this.get('url'),
			id = this.get('id'),
			title = this.get('title');

		if (url) {
			this.get('logger').debug('Handling map with id:', id, 'and title:', title);

			track({
				action: trackActions.click,
				category: 'map',
				label: 'open'
			});

			this.get('openLightbox')('map', {
				id,
				title,
				url
			});

			return false;
		}
	}
});
