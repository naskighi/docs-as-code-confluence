const Confluence = require("confluence-api");
const core = require("@actions/core");
const parser = require("node-html-parser")
const path = require('path')
const fs = require("fs");

const filesStructure = require("./utils/files");
const SyncConfluence = require("./utils/confluence");
const markdownToHtml = require("./utils/markdownToHtml");

const dryRun = core.getInput("dry-run") === "true";
const previewOutputFolder = core.getInput("preview-output-folder") || "preview-html";

const root = "./" + core.getInput("folder", { required: true }) + "/";
const spaceKey = core.getInput("space-key", { required: !dryRun });
const rootParentPageId = core.getInput("parent-page-id", { required: !dryRun });

const config = {
  username: core.getInput("username", { required: !dryRun }),
  password: core.getInput("password", { required: !dryRun }),
  baseUrl: core.getInput("confluence-base-url", { required: !dryRun }),
};

const confluenceAPI = dryRun ? undefined : new Confluence(config);
const syncConfluence = dryRun
  ? undefined
  : new SyncConfluence(
      confluenceAPI,
      spaceKey,
      rootParentPageId
    );

const cachedPageIdByTitle = {};

async function findOrCreatePage(pageTitle, parentPageId) {
  let pageId;
  if (cachedPageIdByTitle[pageTitle]) {
    pageId = cachedPageIdByTitle[pageTitle];
  } else {
    pageId = await syncConfluence.getPageIdByTitle(pageTitle);
    if (pageId) {
    } else {
      pageId = await syncConfluence.createEmptyParentPage(
        pageTitle,
        parentPageId
      );
    }
    cachedPageIdByTitle[pageTitle] = pageId;
  }
  return pageId;
}

function markdownToHtmlAsync(filePath) {
  return new Promise((resolve, reject) => {
    markdownToHtml(filePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

async function writePreviewFile(sourcePath, rootPath, htmlContent) {
  const relativePath = path.relative(rootPath, sourcePath).replace(/\.md$/, ".html");
  const destinationPath = path.join(previewOutputFolder, relativePath);
  await fs.promises.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.promises.writeFile(destinationPath, htmlContent, { encoding: "utf-8" });
  console.log("[dry-run] Wrote preview file %s", destinationPath);
}

async function uploadAttachment(attachmentSource, pageId) {
  attachmentSource = root + attachmentSource;
  const existingAttachments = await syncConfluence.getAttachments(pageId)
  if (existingAttachments) {
    for (let attachment of existingAttachments) {
      if (attachment.title === path.basename(attachmentSource)) {
        return await syncConfluence.updateAttachment(pageId, attachment.id, attachmentSource);
      }
    }
  }
  return await syncConfluence.uploadAttachment(pageId, attachmentSource);
}

async function handleAttachments(contentPageId, data) {
  const html = parser.parse(data);
  const images = html.querySelectorAll("img")
  for (var image of images) {
    const attachmentSource = image.getAttribute("src");
    // TODO handle remote images
    if (attachmentSource.includes("http")) { continue; }
    var attachment = await uploadAttachment(attachmentSource.replace("..", "."), contentPageId);
    image.replaceWith(parser.parse('<ac:image><ri:attachment ri:filename=' + attachment.title +' /></ac:image>'));
  }
  return html.toString()
}

async function main() {
  const files = filesStructure(root);
  if (!files.length) {
    console.log("No markdown files found in %s", root);
  }

  if (dryRun) {
    console.log("Running in dry-run mode. No content will be sent to Confluence.");
  }

  for (const f of files) {
    let currentPath = f.join("/");
    let currentParentPageId = rootParentPageId;
    let pathsInRoot = root.split("/");
    let newRoot= root;
    if(pathsInRoot.length > 2){
      newRoot = "./" + pathsInRoot[1] + "/"
      console.log("Root for action includes subfolder. Assigning root as: " +  newRoot)
    }
    for (const subPath of f) {
      if (subPath.includes(".md")) {
        let pageTitle = subPath.replace(".md", "");
        let markdownFilePath = newRoot + currentPath;
        let htmlContent = await markdownToHtmlAsync(markdownFilePath);

        if (dryRun) {
          await writePreviewFile(markdownFilePath, newRoot, htmlContent);
          continue;
        }

        let contentPageId = await findOrCreatePage(
          pageTitle,
          currentParentPageId
        );
        htmlContent = await handleAttachments(contentPageId, htmlContent);
        syncConfluence.putContent(contentPageId, pageTitle, htmlContent);
      } else if (!dryRun) {
        currentParentPageId = await findOrCreatePage(
          subPath,
          currentParentPageId
        );
      }
    }
  }
}

main();
