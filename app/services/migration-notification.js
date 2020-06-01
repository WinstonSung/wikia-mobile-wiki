import Service, { inject as service } from '@ember/service';
import localStorageConnector from '@wikia/ember-fandom/utils/local-storage-connector';

export default Service.extend({
  fastboot: service(),
  wdsBannerNotifications: service(),
  wikiVariables: service(),

  afterMigrationClosedStorageKey: 'wikia-org-migration-after-closed',
  beforeMigrationClosedStorageKey: 'wikia-org-migration-before-closed',
  afterFandomComMigrationClosedStorageKey: 'fandom-com-migration-after-closed',
  beforeFandomComMigrationClosedStorageKey: 'fandom-com-migration-before-closed',
  ucpMigrationBannerClosedStorageKey: 'ucp-migration-banner-closed',
  storageTrueValue: '1',

  shouldShowAfterMigrationNotification() {
    return this.wikiVariables.wikiaOrgMigrationNotificationAfter
      && localStorageConnector.getItem(
        this.afterMigrationClosedStorageKey,
      ) !== this.storageTrueValue;
  },

  shouldShowBeforeMigrationNotification() {
    return this.wikiVariables.wikiaOrgMigrationNotificationBefore
      && localStorageConnector.getItem(
        this.beforeMigrationClosedStorageKey,
      ) !== this.storageTrueValue;
  },

  shouldShowUCPMigrationNotification() {
    return this.wikiVariables.ucpMigrationBannerMessage
      && localStorageConnector.getItem(
        this.ucpMigrationBannerClosedStorageKey,
      ) !== this.storageTrueValue;
  },

  shouldShowAfterFandomComMigrationNotification() {
    return this.wikiVariables.fandomComMigrationNotificationAfter
      && localStorageConnector.getItem(
        this.afterFandomComMigrationClosedStorageKey,
      ) !== this.storageTrueValue;
  },

  shouldShowBeforeFandomComMigrationNotification() {
    return this.wikiVariables.fandomComMigrationNotificationBefore
      && localStorageConnector.getItem(
        this.beforeFandomComMigrationClosedStorageKey,
      ) !== this.storageTrueValue;
  },

  showMigrationNotification(message, storageKey) {
    this.wdsBannerNotifications.addNotification({
      type: 'warning',
      alreadySafeHtml: message,
      disableAutoHide: true,
      onClose: () => {
        localStorageConnector.setItem(
          storageKey,
          this.storageTrueValue,
        );
      },
    });
  },

  showNotification() {
    if (this.fastboot.isFastBoot) {
      return;
    }

    // Fandom.com migration banners
    if (this.shouldShowAfterFandomComMigrationNotification()) {
      this.showMigrationNotification(
        this.wikiVariables.fandomComMigrationNotificationAfter,
        this.afterFandomComMigrationClosedStorageKey,
      );
    } else if (this.shouldShowBeforeFandomComMigrationNotification()) {
      this.showMigrationNotification(
        this.wikiVariables.fandomComMigrationNotificationBefore,
        this.beforeFandomComMigrationClosedStorageKey,
      );
    }

    // Wikia.org migration banners
    if (this.shouldShowAfterMigrationNotification()) {
      this.showMigrationNotification(
        this.wikiVariables.wikiaOrgMigrationNotificationAfter,
        this.afterMigrationClosedStorageKey,
      );
    } else if (this.shouldShowBeforeMigrationNotification()) {
      this.showMigrationNotification(
        this.wikiVariables.wikiaOrgMigrationNotificationBefore,
        this.beforeMigrationClosedStorageKey,
      );
    }

    // UCP migration banners
    if (this.shouldShowUCPMigrationNotification()) {
      this.showMigrationNotification(
        this.wikiVariables.ucpMigrationBannerMessage,
        this.ucpMigrationBannerClosedStorageKey,
      );
    }
  },
});