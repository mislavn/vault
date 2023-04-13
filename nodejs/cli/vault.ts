#!/usr/bin/env node
import sade from "sade";
import { loadOptions } from "../lib/loadOptions";
import { vault } from "../lib/vaultClient";

const DEFAULT_STACK_NAME = "vault";

const handleRejection = (err: string) => {
  console.error(err);
  process.exit(1);
};

const prog = sade("vault");

prog.option(
  "--vaultstack",
  "Optional CloudFormation stack to lookup key and bucket.",
  DEFAULT_STACK_NAME
);
prog.option(
  "-p, --prefix",
  "Optional prefix to store values under. Empty by default"
);
prog.option(
  "-b, --bucket",
  "Override the bucket name either for initialization or storing and looking up values"
);
prog.option(
  "-k, --key-arn",
  "Override the KMS key arn for storing or looking up values"
);
prog.option(
  "--id",
  "Give an IAM access key id to override those defined by the environment"
);
prog.option(
  "--secret",
  "Give an IAM secret access key to override those defined by the environment"
);
prog.option("-r, --region", "Give a region for the stack and the bucket");

prog
  .command("store <name> <value>")
  .describe("Store data in the vault")
  .option(
    "-w, --overwrite",
    "Overwrite the current value if it already exists",
    false
  )
  .action(async (name, value, options) => {
    vault(options)
      .then(async (client) => {
        if (!options.overwrite) {
          if (await client.exists(name)) {
            console.log(
              "Error storing key, it already exists and you did not provide \x1b[33m-w\x1b[0m flag for overwriting"
            );
          }
        }
        client.store(name, value);
      })
      .catch(handleRejection);
  })
  .command("lookup <name>")
  .describe("Look up data from the vault")
  .action(async (name, options) => {
    const client = await vault(options);
    client.lookup(name).then(console.log).catch(handleRejection);
  })
  .command("delete <name>")
  .describe("Delete data from the vault")
  .action((name, options) => {
    vault(options)
      .then((client) => client.delete(name))
      .catch(handleRejection);
  })
  .command("exists <name>")
  .describe("Check if the vault contains data")
  .action((name, options) => {
    vault(options)
      .then((client) => client.exists(name))
      .then(console.log)
      .catch(handleRejection);
  })
  .command("all")
  .describe("List all keys the vault contains")
  .action((options) => {
    vault(options)
      .then((client) => client.all())
      .then((res) => console.log(res.join("\n")))
      .catch(handleRejection);
  });

prog.parse(process.argv);