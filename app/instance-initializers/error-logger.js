import config from '../config/environment';


export function initialize(/* appInstance */) {
  if (typeof FastBoot !== 'undefined') {
      return;
  }

  Ember.onerror = function(error) {
    const url = `https://${config.services.domain}/${config.services.eventLogger.baseAPIPath}/error`;

    console.log(url);
    console.log(error);
    Ember.$.ajax(url, {
      type: 'POST',
      data: {
        name: "Ember.onerror",
        description: error.message,
        client: "mobile-wiki"
      }
    })
  };
}

export default {
  after: 'config',
  name: 'error-logger',
  initialize
};
