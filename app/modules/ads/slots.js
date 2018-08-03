import offset from '../../utils/offset';

const MIN_ZEROTH_SECTION_LENGTH = 700;
const MIN_NUMBER_OF_SECTIONS = 4;
const PAGE_TYPES = {
	article: 'a',
	home: 'h'
};

function setSlotState(slotName, state) {
	const { slotService } = window.Wikia.adEngine;

	if (state) {
		slotService.enable(slotName);
	} else {
		slotService.disable(slotName);
	}
}

function isTopLeaderboardApplicable() {
	const { context } = window.Wikia.adEngine;

	const hasFeaturedVideo = context.get('custom.hasFeaturedVideo'),
		isHome = context.get('custom.pageType') === 'home',
		hasPageHeader = !!document.querySelector('.wiki-page-header'),
		hasPortableInfobox = !!document.querySelector('.portable-infobox');

	return isHome || hasPortableInfobox || (hasPageHeader > 0 && !hasFeaturedVideo);
}

function isInContentApplicable() {
	const { context } = window.Wikia.adEngine;

	if (context.get('custom.pageType') === 'home') {
		return !!document.querySelector('.curated-content');
	}

	const firstSection = document.querySelector('.article-content > h2'),
		firstSectionTop = (
			firstSection &&
			offset(firstSection).top
		) || 0;

	return firstSectionTop > MIN_ZEROTH_SECTION_LENGTH;
}

function isPrefooterApplicable(isInContentApplicable) {
	const { context } = window.Wikia.adEngine;

	if (context.get('custom.pageType') === 'home') {
		return !!document.querySelector('.trending-articles');
	}

	const numberOfSections = document.querySelectorAll('.article-content > h2').length,
		hasArticleFooter = !!document.querySelector('.article-footer');

	return hasArticleFooter && !isInContentApplicable || numberOfSections > MIN_NUMBER_OF_SECTIONS;
}

function isBottomLeaderboardApplicable() {
	return !!document.querySelector('.wds-global-footer');
}

export default {
	getContext() {
		return {
			mobile_top_leaderboard: {
				aboveTheFold: true,
				adProduct: 'mobile_top_leaderboard',
				slotNameSuffix: '',
				group: 'LB',
				options: {},
				slotShortcut: 'l',
				sizes: [],
				defaultSizes: [[320, 50], [320, 100], [300, 50]], // Add [2, 2] for UAP
				targeting: {
					loc: 'top',
					pos: 'MOBILE_TOP_LEADERBOARD',
					rv: 1
				}
			},
			mobile_in_content: {
				adProduct: 'mobile_in_content',
				slotNameSuffix: '',
				group: 'HiVi',
				options: {},
				slotShortcut: 'i',
				sizes: [],
				defaultSizes: [[320, 50], [300, 250], [300, 50], [320, 480]],
				targeting: {
					loc: 'middle',
					pos: ['MOBILE_IN_CONTENT'],
					rv: 1
				}
			},
			incontent_boxad_1: {
				adProduct: 'incontent_boxad_1',
				slotNameSuffix: '',
				bidderAlias: 'mobile_in_content',
				group: 'HiVi',
				options: {},
				repeat: {
					additionalClasses: 'hide',
					index: 1,
					insertBeforeSelector: '.article-body h2',
					limit: null,
					slotNamePattern: 'incontent_boxad_{slotConfig.repeat.index}',
					updateProperties: {
						adProduct: '{slotConfig.slotName}',
						'targeting.rv': '{slotConfig.repeat.index}',
						'targeting.pos': ['INCONTENT_BOXAD', 'MOBILE_IN_CONTENT']
					}
				},
				slotShortcut: 'f',
				sizes: [
					{
						viewportSize: [375, 627],
						sizes: [[300, 50], [320, 50], [300, 250], [300, 600]]
					}
				],
				defaultSizes: [[320, 50], [300, 250], [300, 50]],
				targeting: {
					loc: 'middle',
					pos: ['INCONTENT_BOXAD', 'MOBILE_IN_CONTENT'],
					rv: 1
				}
			},
			mobile_prefooter: {
				adProduct: 'mobile_prefooter',
				slotNameSuffix: '',
				disabled: true,
				disableManualInsert: true,
				group: 'PF',
				options: {},
				slotShortcut: 'p',
				sizes: [],
				defaultSizes: [[320, 50], [300, 250], [300, 50]],
				targeting: {
					loc: 'footer',
					rv: 1
				}
			},
			bottom_leaderboard: {
				adProduct: 'bottom_leaderboard',
				slotNameSuffix: '',
				group: 'PF',
				options: {},
				slotShortcut: 'b',
				sizes: [
					{
						viewportSize: [375, 627],
						sizes: [[300, 50], [320, 50], [300, 250], [300, 600]]
					}
				],
				defaultSizes: [[320, 50], [300, 250], [300, 50]], // Add [2, 2] for UAP
				targeting: {
					loc: 'footer',
					pos: ['BOTTOM_LEADERBOARD', 'MOBILE_PREFOOTER'],
					rv: 1
				}
			},
			featured: {
				adProduct: 'featured',
				slotNameSuffix: '',
				nonUapSlot: true,
				group: 'VIDEO',
				lowerSlotName: 'featured',
				targeting: {
					pos: 'FEATURED',
					uap: 'none',
				},
				trackingKey: 'featured-video',
			},
			video: {
				adProduct: 'video',
				slotNameSuffix: '',
				nonUapSlot: true,
				group: 'VIDEO',
				lowerSlotName: 'video',
				targeting: {
					pos: 'VIDEO',
					uap: 'none',
				},
				trackingKey: 'video',
			},
		};
	},

	setupSlotParameters(slot) {
		const audioSuffix = slot.config.audio === true ? '-audio' : '';
		const clickToPlaySuffix = slot.config.autoplay === true || slot.config.videoDepth > 0 ? '' : '-ctp';

		slot.setConfigProperty('slotNameSuffix', clickToPlaySuffix || audioSuffix || '');
		slot.setConfigProperty('targeting.audio', audioSuffix ? 'yes' : 'no');
		slot.setConfigProperty('targeting.ctp', clickToPlaySuffix ? 'yes' : 'no');
	},

	setupStates() {
		const { context } = window.Wikia.adEngine;

		const incontentState = isInContentApplicable();

		setSlotState('MOBILE_TOP_LEADERBOARD', isTopLeaderboardApplicable());
		setSlotState('MOBILE_IN_CONTENT', incontentState);
		setSlotState('MOBILE_PREFOOTER', isPrefooterApplicable(incontentState));
		setSlotState('BOTTOM_LEADERBOARD', isBottomLeaderboardApplicable());
		setSlotState('FEATURED', context.get('custom.hasFeaturedVideo'));
	},

	setupIdentificators() {
		const { context } = window.Wikia.adEngine;

		const pageTypeParam = PAGE_TYPES[context.get('targeting.s2')] || 'x';
		const slotsDefinition = context.get('slots');

		// Wikia Page Identificator
		context.set('targeting.wsi', `mx${pageTypeParam}1`);
		Object.keys(slotsDefinition).forEach((key) => {
			const slotParam = slotsDefinition[key].slotShortcut || 'x';
			context.set(`slots.${key}.targeting.wsi`, `m${slotParam}${pageTypeParam}1`);
		});
	},

	setupIncontentPlayer() {
		const { context } = window.Wikia.adEngine;
		const slots = ['mobile_in_content', 'incontent_boxad_1'];

		// ToDo: don't set up player if is UAP loaded
		if (!context.get('custom.hasFeaturedVideo')) {
			slots.forEach((slot) => {
				const pos = context.get(`slots.${slot}.targeting.pos`);

				pos.push('INCONTENT_PLAYER');

				context.set(`slots.${slot}.targeting.pos`, pos);
			});
		}
	}
};
