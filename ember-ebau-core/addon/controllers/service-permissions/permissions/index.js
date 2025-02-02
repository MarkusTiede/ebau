import Controller from "@ember/controller";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import { tracked } from "@glimmer/tracking";
import { dropTask, restartableTask, timeout } from "ember-concurrency";

import paginatedQuery from "ember-ebau-core/resources/paginated";

export default class ServicePermissionsPermissionsIndexController extends Controller {
  @service store;

  @tracked search = "";
  @tracked page = 1;

  queryParams = ["search"];

  userGroups = paginatedQuery(this, "user-group", () => ({
    include: "user,group,created_by",
    search: this.search,
    page: {
      number: this.page,
      size: 20,
    },
  }));

  delete = dropTask(async (userGroup, event) => {
    event.preventDefault();

    await userGroup.destroyRecord();
    await this.userGroups.retry();
  });

  updateSearch = restartableTask(async (event) => {
    await timeout(500);

    this.search = event.target.value;
    this.page = 1;
  });

  @action
  updatePage() {
    if (this.userGroups.hasMore && !this.userGroups.isLoading) {
      this.page += 1;
    }
  }
}
