import Ember from 'ember';
import {DesignSystemFetchError} from '../utils/errors';
import fetch from '../utils/mediawiki-fetch';
import {buildUrl} from '../utils/url';

const {
	Object: EmberObject
} = Ember;

const NavigationModel = EmberObject.extend({});


NavigationModel.reopenClass({
	getAll(host, wikiId, language) {
		return fetch(
			buildUrl({
				host,
				path: `/api/v1/design-system/wikis/${wikiId}/${language}/`,
				wiki: 'www'
			})
		)
			.then((navigationApiResponse) => {
				if (!navigationApiResponse.ok) {
					throw new DesignSystemFetchError({
						code: navigationApiResponse.status || 503
					}).withAdditionalData({
						host,
						response: navigationApiResponse.json()
					});
				}

				return navigationApiResponse.json();
			})
			.then((navigationData) => {
				return {
					globalFooter: navigationData['global-footer'],
					globalNavigation: navigationData['global-navigation']
				};
			});
	}
});

export default NavigationModel;
