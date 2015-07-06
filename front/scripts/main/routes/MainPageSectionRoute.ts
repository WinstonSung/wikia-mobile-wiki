/// <reference path="../app.ts" />
/// <reference path="../../../../typings/ember/ember.d.ts" />

App.MainPageSectionRoute = Em.Route.extend({
	model: function (params: any): Em.RSVP.Promise {
		return App.CuratedContentModel.find(params.sectionName, 'section');
	},

	afterModel: function (model: any): void {
		var sectionName = M.String.normalize(decodeURIComponent(model.get('title'))),
			mainPageController = this.controllerFor('mainPage'),
			adsContext = $.extend({}, M.prop('mainPageData.adsContext'));

		document.title = sectionName + ' - ' + Em.getWithDefault(Mercury, 'wiki.siteName', 'Wikia');

		mainPageController.setProperties({
			isRoot: false,
			title: sectionName,
			adsContext: adsContext,
			ns: M.prop('mainPageData.ns')
		});
	},

	renderTemplate: function (controller: any, model: typeof App.CuratedContentModel): void {
		this.render('main-page', {
			controller: 'mainPage',
			model: {
				curatedContent: model
			}
		})
	},

	actions: {
		error: function (error: any): boolean {
			if (error && error.status === 404) {
				this.controllerFor('application').addAlert('warning', i18n.t('app.curated-content-error-section-not-found'));
			} else {
				this.controllerFor('application').addAlert('warning', i18n.t('app.curated-content-error-other'));
			}
			this.transitionTo('mainPage');
			return true;
		}
	}
});
