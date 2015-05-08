/// <reference path='../../../../typings/ember/ember.d.ts' />
/// <reference path='../app.ts' />
'use strict';

/**
 * This mixin keeps track of viewport size which is updated on every window resize.
 * Mixin has two properties stored as an object: viewport height and viewport width.
 * It is stored as object because objects and arrays are shared among all objects which include mixin.
 * @type {Ember.Mixin}
 */
App.ViewportMixin = Em.Mixin.create({
	//This object is shared among all objects which include this mixin
	viewportDimensions: {
		height: null,
		width: null
	},
	initiated: false,
	$body: null,

	init: function (): void {
		this._super();
		if (!this.get('initiated')) {
			Em.$(window).on('resize', () => {
				this.onResize();
			});
			this.set('$body', Em.$('body'));
			this.set('initiated', true);
		}
	},

	onResize: function (): void {
		this.set('viewportDimensions.width', this.get('$body').width());
		this.set('viewportDimensions.height', this.get('$body').height());
	}
});
