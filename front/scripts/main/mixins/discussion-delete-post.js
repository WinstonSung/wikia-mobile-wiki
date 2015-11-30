import App from '../app';

export default App.DiscussionDeletePostMixin = Ember.Mixin.create({
	checkPermissions(post, permission) {
		return Ember.get(post, '_embedded.userData')[0].permissions.contains(permission);
	},

	deletePost(post) {
		if (this.checkPermissions(post, 'canDelete')) {
			return new Ember.RSVP.Promise((resolve) => {
				Ember.$.ajax({
					method: 'PUT',
					url: M.getDiscussionServiceUrl(`/${this.wikiId}/threads/${post.threadId}/delete`),
					xhrFields: {
						withCredentials: true,
					},
					dataType: 'json',
					success: (data) => {
						Ember.set(post, 'isDeleted', true);
						resolve(this);
					},
					error: (err) => {
						// TODO
						this.setErrorProperty(err);
						resolve(this);
					}
				});
			});
		}
	},
	undeletePost(post) {
		if (this.checkPermissions(post, 'canUndelete')) {
			return new Ember.RSVP.Promise((resolve) => {
				Ember.$.ajax({
					method: 'PUT',
					url: M.getDiscussionServiceUrl(`/${this.wikiId}/threads/${post.threadId}/undelete`),
					xhrFields: {
						withCredentials: true,
					},
					dataType: 'json',
					success: (data) => {
						Ember.set(post, 'isDeleted', false);
						resolve(this);
					},
					error: (err) => {
						// TODO
						this.setErrorProperty(err);
						resolve(this);
					}
				});
			});
		}
	}
});
