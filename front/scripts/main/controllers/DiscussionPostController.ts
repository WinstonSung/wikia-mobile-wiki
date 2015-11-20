/// <reference path="../app.ts" />
'use strict';

App.DiscussionPostController = Em.Controller.extend({
	numRepliesLoaded: null,
	postListSort: '',

	canShowMore: Em.computed('model', 'numRepliesLoaded', function (): boolean {
		var model: typeof App.DiscussionPostModel = this.get('model'),
			numRepliesLoaded: number = this.get('numRepliesLoaded');

		if (numRepliesLoaded === null) {
			numRepliesLoaded = Em.get(model, 'replies.length');
			this.set('numRepliesLoaded', numRepliesLoaded);
		}

		return numRepliesLoaded < model.postCount;
	}),

	actions: {

		/**
		 * @returns {void}
		 */
		expand(): void {
			var model = this.get('model');

			model.loadNextPage().then(() => {
				var model = this.get('model');
				if (model.get('minorError')) {
					this.set('numRepliesLoaded', model.get('postCount'));
				} else {
					this.set('numRepliesLoaded', model.get('replies.length'));
				}
			});
		},

		/**
		 * Bubbles up to DiscussionPostRoute
		 *
		 * @returns {void}
		 */
		retry(): void {
			this.get('target').send('retry');
		},

		/**
		 * @returns {void}
		 */
		goToAllDiscussions(): void {
			this.get('target').send('goToAllDiscussions');
		},

		/**
		 * @returns {void}
		 */
		goToForum(): void {
			var model = this.get('model');
			this.get('target').send('goToForum', model.get('forumId'), this.get('postListSort'));
		}
	}
});
