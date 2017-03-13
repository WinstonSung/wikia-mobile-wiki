import Ember from 'ember';
import fetch from 'ember-network/fetch';
import M from '../../mmm';

const VariablesModel = Ember.Object.extend({

});

VariablesModel.reopenClass({
	get(host) {
		const url = M.buildUrl({
			host,
			path: '/wikia.php',
			query: {
				controller: 'MercuryApi',
				method: 'getWikiVariables',
				format: 'json'
			}
		});

		return fetch(url).then(response => response.json()).then(response => {
			return response.data;
		}).then(data => {
			return fetch(`http://www.damian.wikia-dev.pl/api/v1/design-system/wikis/${data.id}/${data.language.content}/`)
				.then(navigationApiResponse => navigationApiResponse.json())
				.then(navigationData => {
					data.globalFooter = navigationData['global-footer'];

					return data;
				});
		});
	}
});

export default VariablesModel;
