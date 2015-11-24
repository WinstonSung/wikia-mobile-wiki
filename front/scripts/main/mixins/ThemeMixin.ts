/// <reference path="../app.ts" />
/// <reference path="../mixins/ColorUtilsMixin.ts" />
'use strict';

/**
 * Sets the theme class for the body. For now only for dark theme, because the light is default.
 */

App.ThemeMixin = Em.Mixin.create(App.ColorUtilsMixin, {
	cssPath: '/front/styles/main',
	themeActivated: null,
	themeColors: null,
	themeLoadingInitialized: null,
	themeSettings: {
		dark: {
			class: 'dark-theme',
			css: 'app-dark-theme.css'
		}
	},

	activate(): void {
		this._super();

		this.applyThemeColorStyles();

		if (true) {
			this.set('themeActivated', 'dark');
			Em.$('body').addClass(this.themeSettings.dark.class);
		}

		if (!this.get('themeLoadingInitialized')) {
			this.loadThemeCss();
		}
	},

	/**
	 * Loads other theme css
	 * @returns {void}
	 */
	loadThemeCss(): void {
		if (!this.themeActivated || !this.themeSettings[this.themeActivated]) {
			return;
		}

		this.set('themeLoadingInitialized', true);

		$('<link>')
			.attr({type: 'text/css', rel: 'stylesheet'})
			.attr('href', `${this.cssPath}/${this.themeSettings[this.themeActivated].css}`)
			.appendTo('head');
	},

	/**
	 * Sets inline styles with the theme colors
	 * @returns {void}
	 */
	applyThemeColorStyles(): void {
		var inlineStyles: JQuery,
			styleId: string = 'discussionInlineStyles',
			styles: string = '';

		if (Em.$('#' + styleId).length) {
			return;
		}

		this.set('themeColors', Em.get(Mercury, 'wiki.theme'));

		if (!this.get('themeColors')) {
			return;
		}

		styles += `.discussions .border-theme-color {border-color: ${this.get('themeColors.color-buttons')};}`;
		styles += `.discussions .background-theme-color {background-color: ${this.get('themeColors.color-buttons')};}`;
		styles += `.discussions .background-alpha-theme-color {background-color: ${this.getRgbaColor(this.hexToRgb(this.get('themeColors.color-buttons'), 0.8))};}`;

		styles += `.discussion a {color: ${this.get('themeColors.color-links')};}`;
		styles += `.discussions .active-element-theme-color {color: ${this.get('themeColors.color-links')};}`;
		styles += `.discussions .active-element-border-theme-color {border-color: ${this.get('themeColors.color-links')};}`;
		styles += `.discussions .fill-theme-color {fill: ${this.get('themeColors.color-links')};}`;
		styles += `.discussions .stroke-theme-color {stroke: ${this.get('themeColors.color-links')};}`;

		inlineStyles = Em.$('<style>').attr('id', styleId) ;
		inlineStyles.text(styles);

		Em.$('head').append(inlineStyles);
	}
});
