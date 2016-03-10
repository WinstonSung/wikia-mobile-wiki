import Ember from 'ember';
import DiscussionParsedContentMixin from '../mixins/discussion-parsed-content';
import DiscussionMoreOptionsMixin from '../mixins/discussion-more-options';

const {Component, computed} = Ember;

/**
 * Basic methods/properties for discussion-post-card-detail and discussion-post-card-reply.
 */
export default Component.extend(
	DiscussionParsedContentMixin,
	DiscussionMoreOptionsMixin,
	{
		classNameBindings: ['isNew', 'isDeleted', 'isReported', 'showTopNote'],

		isDeleted: computed.alias('post.isDeleted'),
		isNew: computed.oneWay('post.isNew'),
		isReported: computed.alias('post.isReported'),
		showTopNote: computed('isDeleted', 'isReported', 'post.isLocked', function () {
			return !this.get('isDeleted') && this.get('isReported') || this.get('showRepliedTo') ||
				this.get('post.isLocked');
		})
	}
);
