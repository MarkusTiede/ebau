import { render } from "@ember/test-helpers";
import { hbs } from "ember-cli-htmlbars";
import { setupIntl } from "ember-intl/test-support";
import { module, test } from "qunit";

import { setupRenderingTest } from "dummy/tests/helpers";

module("Integration | Component | activation-indicator", function (hooks) {
  setupRenderingTest(hooks);
  setupIntl(hooks);

  test("it renders", async function (assert) {
    this.set("activation", {});
    await render(hbs`<ActivationIndicator @activation={{this.activation}}/>`);
    assert.dom("span").doesNotHaveAttribute("title");

    this.set("activation", { state: "NFD" });
    await render(hbs`<ActivationIndicator @activation={{this.activation}}/>`);
    assert.dom("span").hasAttribute("title", "t:dashboard.nfd:()");
  });
});
