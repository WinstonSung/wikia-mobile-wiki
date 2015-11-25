App.ImageReviewRoute = Em.Route.extend(
    App.ImageReviewMixin, {

		model() {
			console.log("Imager review route called!");
			return App.ImageReviewModel.startSession()
		},
		actions: {
			error(error) {
				console.log('Action error: '+JSON.stringify(error));
				if (error.status === 401) {
					this.controllerFor('imageReview').addAlert({
						message: 'Unauthorized, you don\'t have permissions to see this page',
						type: 'warning'
					});
					this.handleTransitionToMainPage();
				} else {
					Em.Logger.error(error);
					this.controllerFor('imageReview').addAlert({
						message: 'Couldn\'t load image-review',
						type: 'warning'
					});
					this.handleTransitionToMainPage();
				}
				return true;
			}
		}
});
