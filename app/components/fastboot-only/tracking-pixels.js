import {inject as service} from '@ember/service';
import {reads} from '@ember/object/computed';
import Component from '@ember/component';

export default Component.extend({
	tagName: '',
	tracking: service(),
	comscore: reads('tracking.config.comscore'),
	quantcast: reads('tracking.config.quantcast')
});
