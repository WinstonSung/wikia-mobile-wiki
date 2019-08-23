import { inject as service } from '@ember/service';
import { equal, alias } from '@ember/object/computed';
import Controller, { inject as controller } from '@ember/controller';
import { track, trackActions } from '../utils/track';

export default Controller.extend({
  application: controller(),
  fastboot: service(),
  wikiVariables: service(),

  searchId: null,
  // TODO: to be removed as we'll be supporting more errors on search page,
  // see: https://wikia-inc.atlassian.net/browse/DAT-4324
  notFoundError: equal('model.error', 'search-error-not-found'),
  inputPhrase: alias('query'),

  actions: {
    onLoadMore(trackLabel) {
      track({
        action: trackActions.click,
        category: 'wikia-button',
        label: trackLabel,
      });

      this.model.loadMore().then(() => this.trackResultsImpression());
    },

    onResultClick(result) {
      this.trackItemClick(result);
    },

    onScopeChange(newScope) {
      this.model.changeScope(newScope);
    },
  },

  trackItemClick(result) {
    if (this.fastboot.isFastBoot) {
      return;
    }

    const payload = {
      searchPhrase: this.inputPhrase,
      clicked: {
        type: 'article', // currently the only displayed type in the search
        id: result.wikiId + '_' + result.id,
        title: result.title,
        position: result.position + 1, // +1 since we need to start with 1 instead of 0
        thumbnail: false, // we do not show thumbnails on SRP right now
      },
      filters: {
          searchType: this.model.getScope()
      },
      target: 'redirect',
      app: 'mw-mobile',
      siteId: this.wikiVariables.id,
      searchId: this.searchId,
      pvUniqueId: window.pvUID,
    };

    M.trackingQueue.push(() => window.searchTracking.trackSearchClicked(payload));
  },

  trackResultsImpression() {
    if (this.fastboot.isFastBoot) {
      return;
    }

    const batchSize = 25;
    const batchBegin = this.model.batch * batchSize;
    const batchEnd = batchBegin + batchSize;
    const payload = {
      searchPhrase: this.inputPhrase,
      filters: {
        searchType: this.model.getScope()
      }, // there is no way in mobile-wiki to set any filter
      results: this.model.items.slice(batchBegin, batchEnd).map((item, index) => ({
        id: item.wikiId + '_' + item.id,
        title: item.title,
        position: index + 1, // +1 since we need to start with 1 instead of 0
        thumbnail: false, // we do not show thumbnails on SRP right now,
        wikiId: item.wikiId,
      })),
      page: this.model.batch,
      limit: batchSize,
      sortOrder: 'default',
      app: 'mw-mobile',
      siteId: this.wikiVariables.id,
      searchId: this.searchId,
      pvUniqueId: window.pvUID,
    };

    M.trackingQueue.push(() => window.searchTracking.trackSearchImpression(payload));
  },
});
