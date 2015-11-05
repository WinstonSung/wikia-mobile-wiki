App.LightboxVideoComponent = Em.Component.extend(
	App.ArticleContentMixin,
	{
		classNames: ['lightbox-video', 'lightbox-content-inner'],
		classNameBindings: ['provider'],
		videoLoader: null,

		articleContentWidthObserver: Em.observer('articleContent.width', function () {
			if (this.get('videoLoader')) {
				this.get('videoLoader').onResize();
			}
		}),

		/**
		 * Computed property used to set class in template.
		 * On the first launch this.videoLoader will not exist and it return ''.
		 * As soon as the videoLoader will be set, the property will be changed.
		 */
		provider: Em.computed('videoLoader', function () {
			if (this.get('videoLoader')) {
				return `video-provider-${this.videoLoader.getProviderName()}`;
			}
			return '';
		}),

		/**
		 * @returns {void}
		 */
		didInsertElement() {
			this.initVideoPlayer();
		},

		/**
		 * Used to instantiate a video player
		 *
		 * @returns {void}
		 */
		initVideoPlayer() {
			const videoLoader = new Mercury.Modules.VideoLoader(this.get('model.embed')),
				selector = Em.get(videoLoader, 'player.containerSelector');

			// Stop bubbling it up to the lightbox
			this.$(selector).click(() => {
				return false;
			});

			this.set('videoLoader', videoLoader);
		},
	}
);
