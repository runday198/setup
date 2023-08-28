import Conf from "conf";
import chalk from "chalk";
import process from "node:process";
import fs from "fs/promises";
import pMap from "p-map";
import open from "open";

const { log } = console;
const bundleListName = "list";
const linkListName = "links";
const configPath = (name) =>
  process.platform === "linux"
    ? `~/.config/${name}-nodejs`
    : `C:/Users/pc/AppData/Roaming/${name}-nodejs`;
const isValidUrl = (url) => {
  try {
    return Boolean(new URL(url));
  } catch {
    return false;
  }
};

const entryConf = new Conf({ projectName: "setup-entryConfig" });

const configManager = (function Config() {
  var entryConfig = entryConf;

  var publicAPI = {
    createBundle,
    getBundles,
    getBundle,
    deleteBundle,
    renameBundle,
    addToBundle,
    removeBundleLinks,
    execBundleLinks,
  };

  return publicAPI;

  // Publics

  function createBundle(name) {
    if (checkBundle(name)) {
      log(chalk.redBright("A bundle with this name already exists"));
      process.exit(0);
    }
    initBundle(name);
    addBundle(name);
    log(chalk.greenBright(`The bundle ${name} was successfully created`));
  }

  function getBundles() {
    const bundleList = getBundleList();
    displayList(bundleList);
  }

  function getBundle(name) {
    if (!checkBundle(name)) {
      log(chalk.redBright(`${name} does not exist`));
      process.exit(0);
    }

    const linkList = getLinks(name);
    displayList(linkList);
  }

  function deleteBundle(names) {
    for (let name of names) {
      if (!checkBundle(name)) {
        log(chalk.redBright(`${name} does not exist`));
        continue;
      }
      fs.rm(configPath(name), { recursive: true })
        .then(() => {
          removeBundle(name);
          log(chalk.greenBright(`${name} was deleted`));
        })
        .catch((err) => {
          log(err);
        });
    }
  }

  function renameBundle(target, newName) {
    if (!checkBundle(target)) {
      log(chalk.redBright(`${target} does not exist`));
      process.exit(0);
    }
    if (checkBundle(newName)) {
      log(chalk.redBright(`${newName} already exists`));
      process.exit(0);
    }

    const oldPath = configPath(target);
    const newPath = configPath(newName);

    fs.rename(oldPath, newPath)
      .then(() => {
        removeBundle(target);
        addBundle(newName);
        log(chalk.greenBright(`${target} was renamed to ${newName}`));
      })
      .catch((err) => {
        log(err);
      });
  }

  function addToBundle(bundle, links) {
    if (!checkBundle(bundle)) {
      log(chalk.redBright(`${bundle} does not exist`));
      process.exit(0);
    }

    for (let link of links) {
      if (!isValidUrl(link)) {
        log(chalk.redBright(`${link} is not a valid url`));
        continue;
      }

      addLink(bundle, link);
      log(chalk.greenBright(`${link} was added`));
    }
  }

  function removeBundleLinks(bundle, linkIndexes) {
    if (!checkBundle(bundle)) {
      log(chalk.redBright(`${bundle} does not exist`));
      process.exit();
    }

    let linkList = getLinks(bundle);
    let newList = [];
    for (let [index, link] of linkList.entries()) {
      if (!linkIndexes.includes(String(index + 1))) {
        newList.push(link);
      }
    }

    updateBundleLinks(bundle, newList);
    log(chalk.greenBright(`${bundle} was updated`));
  }

  function execBundleLinks(bundle) {
    if (!checkBundle(bundle)) {
      log(chalk.redBright(`${bundle} does not exist`));
      process.exit();
    }

    const linkList = getLinks(bundle);
    if (linkList.length === 0) {
      log(chalk.blueBright(`${bundle} is empty`));
      process.exit();
    }

    log(chalk.greenBright("Opening links..."));
    pMap(
      linkList,
      (link) => {
        open(link)
          .then(() => {
            log(chalk.greenBright(`${link} opened`));
          })
          .catch(() => {
            log(chalk.redBright(`${link} did not open`));
          });
      },
      { concurrency: 5 }
    );
  }

  // ***
  // Bundle Privates
  // ***

  function getBundleList() {
    return entryConfig.get(bundleListName) || [];
  }

  function updateBundleList(list) {
    entryConfig.set(bundleListName, list);
  }

  function initBundle(name) {
    const config = new Conf({ projectName: name });
    config.set("links", []);
  }

  function addBundle(name) {
    let list = getBundleList();
    list.push(name);
    updateBundleList(list);
  }

  function removeBundle(name) {
    let newList = getBundleList().filter((bundle) => bundle !== name);
    updateBundleList(newList);
  }

  function checkBundle(name) {
    if (getBundleList().includes(name)) {
      return true;
    }
    return false;
  }

  function displayList(list) {
    if (list.length === 0) {
      log(chalk.blueBright("List is empty."));
      process.exit(0);
    }
    for (let [index, value] of list.entries()) {
      log(chalk.greenBright(`${index + 1}. ${value}`));
    }
  }

  // ***
  // Link Privates
  // ***

  function getLinks(bundle) {
    const config = new Conf({ projectName: bundle });
    return config.get(linkListName) || [];
  }

  function updateBundleLinks(bundle, links) {
    const config = new Conf({ projectName: bundle });
    config.set(linkListName, links);
  }

  function addLink(bundle, link) {
    let links = getLinks(bundle);
    links.push(link);
    updateBundleLinks(bundle, links);
  }
})();

export default configManager;
