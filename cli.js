#!/usr/bin/env node

import { program } from "commander";
import configManager from "./config.js";

program
  .command("create <bundle>")
  .description("Create a bundle.")
  .action(configManager.createBundle);

program
  .command("bundles")
  .description("Fetch a list of bundles")
  .action(configManager.getBundles);

program
  .command("bundle <name>")
  .description("Get all links in a bundle")
  .action(configManager.getBundle);

program
  .command("delete <bundle...>")
  .description("Delete a bundle")
  .action(configManager.deleteBundle);

program
  .command("rename <old> <new>")
  .description("Rename a bundle")
  .action(configManager.renameBundle);

program
  .command("add <bundle> <link...>")
  .description("Add a link to a bundle.")
  .action(configManager.addToBundle);

program
  .command("remove <bundle> <links...>")
  .alias("rm")
  .description("Remove links from a bundle")
  .action(configManager.removeBundleLinks);

program
  .command("exec <bundle>")
  .description("Open bundle links")
  .action(configManager.execBundleLinks);

program.parse();
