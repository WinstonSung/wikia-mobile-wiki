import Ember from 'ember';
import DiscussionBaseRoute from './base';

export default DiscussionBaseRoute.extend({
	model() {
		const indexModel = this.modelFor('discussion');

		return Ember.RSVP.hash({
			attributes: indexModel.attributes,
		});
	},

	/**
	 * @returns {void}
	 */
	activate() {
		Ember.$('body').addClass('standalone-page');
		this._super();
	},

	/**
	 * @returns {void}
	 */
	deactivate() {
		Ember.$('body').removeClass('standalone-page');
		this._super();
	},

	actions: {
		saveGuidelines(text) {
			this.modelFor('discussion').attributes.saveAttribute('guidelines', text).then(() => {
				this.get('discussionEditEditor').trigger('newGuidelines');
			}).catch((err) => {
				this.onContributionError(err, 'editor.save-error-general-error', true);
			}).finally(() => {
				this.get('discussionEditEditor').set('isLoading', false);
			});
		},
	}
});
