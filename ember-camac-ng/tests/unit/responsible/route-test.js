import { module, test } from "qunit";

import { setupTest } from "camac-ng/tests/helpers";

module("Unit | Route | responsible", function (hooks) {
  setupTest(hooks);

  test("it exists", function (assert) {
    const route = this.owner.lookup("route:responsible");
    assert.ok(route);
  });
});
