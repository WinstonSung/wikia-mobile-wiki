/// <reference path="../app.ts" />
'use strict';

App.EditView = Em.View.extend({
	classNames: ['edit-view'],
	init: function(): void {
		this._super();
		Em.run.scheduleOnce('afterRender', this, () => {
			this.adjustTextareaHeight();
		});
		// TODO: Call adjustTextareaHeight after resize event and make sure to unsubscribe from that event when destroying the view
	},

	adjustTextareaHeight: function(): void {
		Em.$('textarea').css('height', Em.$(window).height() - Em.$('.edit-head').outerHeight());
	}
});