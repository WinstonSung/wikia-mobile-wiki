import Ember from 'ember';

export default Ember.Component.extend({
	classNames: ['image-review'],
	isModalVisible: false,

	actions: {
		showModal(popupModel) {
			this.set('thumbnailModel', popupModel);
			this.set('isModalVisible', true);
		},
		isContextProvided() {
			return this.get('thumbnailModel').context !== '#';
		}
	}
});
