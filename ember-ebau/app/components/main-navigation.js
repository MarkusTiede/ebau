import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import { isTesting, macroCondition } from "@embroider/macros";
import Component from "@glimmer/component";
import { dropTask } from "ember-concurrency";
import mainConfig from "ember-ebau-core/config/main";
import { trackedTask } from "ember-resources/util/ember-concurrency";
import UIkit from "uikit";

const { languages, name } = mainConfig;

const adminGroup = "1";

export default class MainNavigationComponent extends Component {
  @service session;
  @service store;
  @service router;
  @service fetch;

  languages = languages;

  get logoPath() {
    if (name === "gr") {
      return "/ebau-gr-logo.svg";
    }

    return "/ebau-inosca-logo.svg";
  }

  groups = trackedTask(this, this.fetchGroups, () => [this.session.group]);

  @dropTask
  *fetchGroups() {
    yield Promise.resolve();

    if (!this.session.isAuthenticated) {
      return;
    }
    try {
      const groups = yield this.store.query("public-group", {
        include: ["service", "service.service_group", "role"].join(","),
      });

      this.session.groups = groups;

      return groups;
    } catch (e) {
      console.error(e);
      if (this.session.group) {
        this.setGroup(null);
      }
    }
  }

  resources = trackedTask(this, this.fetchResources, () => [
    this.session.group,
  ]);

  @dropTask
  *fetchResources() {
    yield Promise.resolve();

    if (!this.session.isAuthenticated) {
      return;
    }
    const resources = yield this.store.query("resource", {});

    if (resources.length && this.router.currentURL === "/") {
      this.router.transitionTo(resources.firstObject.link);
    }

    return resources;
  }

  @action
  async setLanguage(language, event) {
    event?.preventDefault();

    if (this.router.currentRoute?.queryParams.language) {
      await this.router.replaceWith({ queryParams: { language: null } });
    }

    this.session.language = language;

    if (macroCondition(!isTesting())) {
      window.location.reload();
    }
  }

  @action
  async setGroup(group, event) {
    event?.preventDefault();

    this.session.group = group;

    if (this.session.group === adminGroup) {
      window.location.href = "/django/admin";
    }

    UIkit.dropdown("#group-dropdown").hide();

    await this.fetch.fetch(`/api/v1/groups/${group}/set-default`, {
      method: "POST",
    });

    if (macroCondition(isTesting())) {
      // Don't reload in testing
    } else {
      this.router.transitionTo("index");
    }
  }

  @action
  logout() {
    this.session.singleLogout();
  }
}
