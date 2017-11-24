import DomHelper from '../dom-helper';
import Ads from '../ads';
import JWPlayerVideoAds from '../video-players/jwplayer-video-ads';
import {track} from '../../utils/track';

let featuredVideoPlayer;

export function initializeMobileWiki() {
	if (!window.mobileWikiInitialized) {
		window.mobileWikiInitialized = true;
		if (typeof FastBoot === 'undefined' && M.getFromShoebox('serverError')) {
			// No need to load Ember in browser on server error page
			return;
		}
		M.loadScript('/mobile-wiki/assets/vendor.js', false, false, 'anonymous');
		M.loadScript('/mobile-wiki/assets/mobile-wiki.js', false, false, 'anonymous');
	}
}

export function setFeaturedVideoPlayer(player) {
	featuredVideoPlayer = player;
}

function onCreate(bidParams, player) {
	const adsInstance = Ads.getInstance();
	if (adsInstance.jwPlayerAds && adsInstance.jwPlayerMoat) {
		adsInstance.jwPlayerAds(player, bidParams);
		adsInstance.jwPlayerMoat(player);
	}

	player.once('adImpression', () => {
		initializeMobileWiki();
	});

	player.once('videoStart', () => {
		initializeMobileWiki();
	});

	setFeaturedVideoPlayer(player);
}

export function updateFeaturedVideoPosition() {
	const articleFeaturedVideoElement = document.querySelector('.article-featured-video');
	if (articleFeaturedVideoElement) {
		const videoOffset = DomHelper.offset(articleFeaturedVideoElement);
		document.querySelector('#pre-featured-video-wrapper').style.top = `${videoOffset.top}px`;
	}
}

export function destroyPlayer() {
	if (featuredVideoPlayer) {
		featuredVideoPlayer.remove();
		featuredVideoPlayer = null;
	}
}


export function initializePlayer(params, bidParams) {
	destroyPlayer();
	window.wikiaJWPlayer(
		'pre-featured-video',
		{
			tracking: {
				track(data) {
					data.trackingMethod = 'both';

					track(data);
				},
				setCustomDimension: M.tracker.UniversalAnalytics.setDimension,
				// TODO comscore
				// comscore: config.environment === 'production'
			},
			settings: {
				showAutoplayToggle: true,
				showCaptions: true
			},
			selectedCaptionsLanguage: params.selectedCaptionsLanguage,
			autoplay: true,
			mute: true,
			related: {
				time: 3,
				playlistId: params.recommendedVideoPlaylist || 'Y2RWCKuS',
				autoplay: true
			},
			videoDetails: {
				description: params.playlist[0].description,
				title: params.playlist[0].title,
				playlist: params.playlist
			},
			logger: {
				clientName: 'mobile-wiki'
			},
			lang: params.lang
		},
		onCreate.bind(this, bidParams)
	);
}

export function createPlayer(params) {
	params.onCreate = onCreate;
	Ads.getInstance().waitForReady()
		.then((new JWPlayerVideoAds(params)).getConfig())
		.then(initializePlayer.bind(this, params));
}

export function loadJWPlayerAssets(params) {
	const head = document.getElementsByTagName('head')[0],
		link = document.createElement('link');
	link.rel = 'stylesheet';
	link.type = 'text/css';
	link.href = '/mobile-wiki/assets/jwplayer/index.css';
	head.appendChild(link);

	M.loadScript('/mobile-wiki/assets/jwplayer/wikiajwplayer.js', false, () => {
		createPlayer(params);
		updateFeaturedVideoPosition();
	}, 'anonymous');
}
