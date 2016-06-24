import Ember from 'ember';
import DiscussionAttributePermissions from './attribute-permissions';

const DiscussionAttribute = Ember.Object.extend({
	value: null,
	permissions: null,
});

DiscussionAttribute.reopenClass({
	/**
	 * @param {object} data
	 *
	 * @returns {Ember.Object}
	 */
	create(data) {
		return this._super({
			value: data.value,
			permissions: DiscussionAttributePermissions.create(data.permissions),
		});
	},
});

export default DiscussionAttribute;
