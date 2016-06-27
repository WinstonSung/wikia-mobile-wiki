import Ember from 'ember';
import DiscussionEditorComponent from './discussion-editor';
import {trackActions} from '../utils/discussion-tracker';

export default DiscussionEditorComponent.extend({
	classNames: ['is-edit'],

	discussionEditor: Ember.inject.service('discussion-edit-editor'),

	placeholderText: 'editor.post-editor-placeholder-text',

	wasInitialized: false,

	didInsertElement() {
		this._super(...arguments);
		this.get('discussionEditor').on('newPost', this, this.handlePostEdited);
	},

	willDestroyElement() {
		this.get('discussionEditor').off('newPost', this, this.handlePostEdited);
	},

	init() {
		this.setProperties({
			closeTrackingAction: trackActions.PostEditClose,
			contentTrackingAction: trackActions.PostEditContent,
			labelText: 'editor.post-edit-editor-label',
			startTrackingAction: trackActions.PostEdit,
			submitText: 'editor.post-edit-action-button-label',
		});

		this._super();
	},

	editorServiceStateObserver: Ember.observer('discussionEditor.isEditorOpen', function () {
		if (this.get('discussionEditor.isEditorOpen')) {
			this.afterOpenActions();
		} else {
			this.get('discussionEditor').set('guidelines', null);
			this.afterCloseActions();
		}
	}),

	/**
	 * Initialize onScroll binding for sticky logic
	 * @returns {void}
	 */
	initializeStickyState() {},

	/**
	 * Perform animations and logic after post creation
	 * @returns {void}
	 */
	handlePostEdited() {
		this.setProperties({
			isLoading: false,
			showSuccess: true
		});

		Ember.run.later(this, () => {
			this.set('showSuccess', false);

			this.get('discussionEditor').toggleEditor(false);
		}, 2000);
	},

	/**
	 * @returns {void}
	 */
	trackContentAction() {
		if (this.get('wasInitialized')) {
			this._super();
		}
	},

	setOpenGraphProperties(text, urlRegex) {
		if (!this.get('wasInitialized')) {
			return;
		}

		this._super(text, urlRegex);
	},

	/**
	 * Open editor and set bodyText to the right value
	 * @returns {void}
	 */
	afterOpenActions() {
		const guidelines = this.get('discussionEditor.guidelines');

		this._super();

		this.setProperties({
			bodyText: guidelines.get('value'),
			showsOpenGraphCard: Boolean(guidelines.get('openGraph'))
		});

		Ember.run.scheduleOnce('afterRender', this, () => {
			// This needs to be triggered after Ember updates textarea content
			this.$('.editor-textarea').get(0).setSelectionRange(0, 0);
			this.set('wasInitialized', true);
		});
	},

	afterCloseActions() {
		this._super();

		this.set('wasInitialized', false);
	},

	actions: {
		/**
		 * Send request to model to create new post and start animations
		 * @returns {void}
		 */
		submit() {
			if (!this.get('submitDisabled')) {
				const guidelines = this.get('discussionEditor.guidelines'),
					editedDisucssionEntity = {
						body: this.get('bodyText')
					};

				this.get('discussionEditor').set('isLoading', true);

				if (this.get('showsOpenGraphCard')) {
					editedDisucssionEntity.openGraph = {
						uri: this.get('openGraph.href')
					};
				}

				if (guidelines.get('isReply')) {
					editedDisucssionEntity.id = guidelines.get('id');

					this.get('editReply')(editedDisucssionEntity);
				} else {
					editedDisucssionEntity.id = guidelines.get('threadId');

					this.get('editPost')(editedDisucssionEntity);
				}
			}
		},
	}
});
