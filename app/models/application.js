import {inject as service} from '@ember/service';
import EmberObject from '@ember/object';
import {all, hashSettled, resolve} from 'rsvp';
import {getOwner} from '@ember/application';
import getHostFromRequest from '../utils/host';
import UserModel from './user';
import NavigationModel from './navigation';
import WikiVariablesModel from './wiki-variables';
import TrackingDimensionsModel from './tracking-dimensions';

export default EmberObject.extend({
	currentUser: service(),
	fastboot: service(),
	logger: service(),

	fetch(title, uselangParam) {
		const currentUser = this.get('currentUser'),
			fastboot = this.get('fastboot'),
			shoebox = fastboot.get('shoebox');

		if (fastboot.get('isFastBoot')) {
			const host = getHostFromRequest(fastboot.get('request')),
				accessToken = fastboot.get('request.cookies.access_token'),
				ownerInjection = getOwner(this).ownerInjection();

			return all([
				WikiVariablesModel.create(ownerInjection).fetch(host, accessToken),
				UserModel.create(ownerInjection).getUserId(accessToken)
			]).then(([wikiVariablesData, userId]) => {
				shoebox.put('userId', userId);

				return hashSettled({
					currentUser: currentUser.initializeUserData(userId, host),
					navigation: NavigationModel.create(ownerInjection).fetchAll(
						host,
						wikiVariablesData.id,
						uselangParam || wikiVariablesData.language.content
					),
					trackingDimensions: TrackingDimensionsModel.create(ownerInjection).fetch(
						!userId,
						host,
						title
					),
					wikiVariablesData
				}).then(({navigation, wikiVariablesData, trackingDimensions}) => {
					// We only want to fail application if we don't have the navigation data
					if (navigation.state === 'rejected') {
						throw navigation.reason;
					}

					const applicationData = {
						navigation: navigation.value,
						wikiVariables: wikiVariablesData.value
					};

					shoebox.put('applicationData', applicationData);

					if (trackingDimensions.state === 'fulfilled' && trackingDimensions.value.dimensions) {
						shoebox.put('trackingDimensionsForFirstPage', trackingDimensions.value.dimensions);
					}

					return applicationData;
				});
			});
		} else {
			currentUser.initializeUserData(shoebox.retrieve('userId'));

			return resolve(shoebox.retrieve('applicationData'));
		}
	}
});
