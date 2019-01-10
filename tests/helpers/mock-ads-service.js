import { Promise } from 'rsvp';
import Service from '@ember/service';

export function getAdsModuleMock(adsContext) {
  let context = {
    init() {},
    pushSlotToQueue() {},
    onReady: cb => cb(),
    onTransition() {},
    reload() {},
    afterTransition() {},
    removeSlot() {},
    waitForUapResponse() {},
    onMenuOpen() {},
    getAdSlotComponentAttributes: name => (
      {
        name,
        hiddenClassName: 'hidden',
        disableManualInsert: false,
        isAboveTheFold: false,
      }
    ),
    isArticleSectionCollapsed: () => true,
    waitForReady(cb) {
      cb();
    },
  };
  if (adsContext) {
    context = Object.assign({}, context, { adsContext });
  }
  return context;
}

export default function (owner) {
  owner.register('service:ads', Service.extend({
    init() {
      this._super(...arguments);

      this.module = getAdsModuleMock();
      this.slotNames = {
        bottomLeaderBoard: 'bottom_leaderboard',
        invisibleHighImpact: 'invisible_high_impact',
        invisibleHighImpact2: 'invisible_high_impact_2',
        mobileInContent: 'mobile_in_content',
        mobilePreFooter: 'mobile_prefooter',
        mobileTopLeaderBoard: 'mobile_top_leaderboard',
      };
    },
    destroyAdSlotComponents() {},
    pushAdSlotComponent() {},
    addWaitFor() {},
    getWaits() {
      return Promise.resolve();
    },
    clearWaits() {},
  }));
}
