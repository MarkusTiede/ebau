import { createReadStream } from "fs";
import fetch from "node-fetch";
import glob from "glob";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { v4 } from "uuid";
import FormData from "form-data";
import chalk from "chalk";

const argv = yargs(hideBin(process.argv)).argv;

const ENVIRONMENTS = {
  local: {
    url: "http://ebau.local",
    groups: [
      22527, 22528, 22529, 22530, 22531, 22532, 22533, 22534, 22535, 22536,
    ],
  },
  test: {
    url: "https://ebau-test.sycloud.ch",
    groups: [
      22615, 22616, 22617, 22674, 22675, 22676, 22677, 22678, 22679, 22680,
      23395,
    ],
  },
  prod: {
    url: "https://www.ebau.apps.be.ch",
    groups: [
      23602, 23603, 23604, 23605, 23606, 23607, 23608, 23609, 23610, 23616,
    ],
  },
};

const getLength = (form) =>
  new Promise((resolve) => form.getLength((_, length) => resolve(length)));

async function run() {
  const globPattern =
    argv.pattern ||
    "../document-merge-service/kt_bern/rsta_templates/**/*.docx";
  const environment = argv.environment || "local";
  const url = ENVIRONMENTS[environment].url;
  const groupIds = argv.groups || ENVIRONMENTS[environment].groups;
  const token = argv.token || process.env.TOKEN;
  const del = Boolean(argv.delete || false);
  const dry = Boolean(argv["dry-run"] || argv["dry"] || false);
  const skip = Boolean(argv["skip-patch"] || false);

  const groups = String(groupIds)
    .split(",")
    .map((s) => parseInt(s.trim()));
  const files = glob.sync(globPattern);

  for (let group of groups) {
    console.log(
      chalk.bold(`\nDistributing ${files.length} files to group ${group}\n`),
    );

    const headers = {
      "x-camac-group": group,
      authorization: token,
    };

    const existingResponse = await fetch(
      `${url}/document-merge-service/api/v1/template/`,
      { headers },
    );

    if (!existingResponse.ok) {
      console.log(
        chalk.red(
          `${chalk.bold(
            "GET",
          )} "${url}/document-merge-service/api/v1/template/" failed with HTTP status ${
            existingResponse.status
          }`,
        ),
      );
      return;
    }

    const existingTemplates = await existingResponse.json();

    if (del) {
      await deleteExisting(existingTemplates, url, headers, dry);
      continue;
    }

    for (let file of files) {
      let [category, filename] = file.split("/").slice(-2);

      filename = filename.replace(".docx", "");
      category = filename.endsWith("_f2") ? null : category;

      const existing = existingTemplates.find(
        (template) =>
          template.group !== null &&
          [template.description, template.meta.rstaIdentifier].includes(
            filename,
          ),
      );

      const slug = existing ? existing.slug : v4();
      const method = existing ? "PATCH" : "POST";

      const body = new FormData();
      body.append("description", filename);
      body.append(
        "meta",
        JSON.stringify({ category, rstaIdentifier: filename }),
      );
      body.append("slug", slug);
      body.append("engine", "docx-template");
      body.append("template", createReadStream(file));

      const msg = `${chalk.bold(method)} "${filename}"`;

      if (method === "PATCH" && skip) {
        console.log(chalk.keyword("orange")(`${msg} was skipped`));
        continue;
      }

      if (!dry) {
        const segment = method === "PATCH" ? `${slug}/` : "";
        const response = await fetch(
          `${url}/document-merge-service/api/v1/template/${segment}`,
          {
            headers: {
              ...headers,
              ...body.getHeaders(),
              "content-length": await getLength(body),
            },
            method,
            body,
          },
        );
        if (response.ok) {
          console.log(
            chalk.green(
              `${msg} successful with HTTP status ${response.status}`,
            ),
          );
        } else {
          console.log(
            chalk.red(`${msg} failed with HTTP status ${response.status}`),
          );
          return;
        }
      } else {
        console.log(chalk.keyword("orange")(`${msg} would be executed`));
      }
    }
  }
}

async function deleteExisting(existing, url, headers, dry) {
  const method = "DELETE";

  const templatesToDelete = existing?.filter(
    (template) =>
      template.meta.rstaIdentifier ||
      /^(bpv|nhhe|nhsb|rsta)_/.test(template.description),
  );

  if (!templatesToDelete?.length) {
    return;
  }

  for (let template of templatesToDelete) {
    const msg = `${chalk.bold(method)} "${template.description}"`;

    if (!dry) {
      const response = await fetch(
        `${url}/document-merge-service/api/v1/template/${template.slug}`,
        { headers, method },
      );
      if (response.ok) {
        console.log(
          chalk.green(`${msg} successful with HTTP status ${response.status}`),
        );
      } else {
        console.log(
          chalk.red(`${msg} failed with HTTP status ${response.status}`),
        );
      }
    } else {
      console.log(chalk.keyword("orange")(`${msg} would be executed`));
    }
  }
}

run();
