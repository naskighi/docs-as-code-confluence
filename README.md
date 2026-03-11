# Docs as Code - Confluence

Publish a folder of documentation to Confluence.

Create a Confluence Page for each markdown file. Each folder will create a _parent_ page to reflect
the directory structure.

## Parameters

| Name                  | Description | Required |
|-----------------------| --- | --- |
| `folder`              | The folder to sync | true |
| `username`            | Confluence username or email | true* |
| `password`            | Confluence password or [API token](https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/) | true* |
| `confluence-base-url` | Your Confluence URL (with `wiki`). Example: `https://mydomain.atlassian.net/wiki` | true* |
| `space-key`           | Confluence space key to publish the documentation. Located after `spaces` in the URL. `https://mydomain.atlassian.net/wiki/spaces/<<~1234>>`. <br> Or in _Space settings_ > _Space details_ > _Key_. | true* |
| `parent-page-id`      | Page id under which the documentation will be published. Located after `pages` in the URL. `https://mydomain.atlassian.net/wiki/spaces/~1234/pages/<<1234>>/My+Parent+Page` | true* |
| `dry-run`             | If `true`, do not publish to Confluence and generate local HTML previews instead. | false |
| `preview-output-folder` | Folder where generated HTML previews are written during `dry-run`. Default: `preview-html`. | false |

\* Required only when `dry-run` is `false`.

## TODO

* Renaming a file
* Moving/Removing a file
* Not updating Confluence pages when there is no change
* Add commit link to the new page version
* Add markdown images with url source

## Example of workflow

```yml
name: Sync Docs as Code - Confluence
on:
  push:
    branches:
      - main
    paths:
      - 'docs/**'
jobs:
  docs-as-code:
    runs-on: ubuntu-latest
    name: Sync Docs as Code - Confluence
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Sync Docs as Code - Confluence
        uses: Bhacaz/docs-as-code-confluence@v3
        with:
          folder: docs
          username: abc@xyz.com
          password: ${{ secrets.API_TOKEN }}
          confluence-base-url: https://mydomain.atlassian.net/wiki
          space-key: ~1234
          parent-page-id: 123456789
```

## Example of usage in a repository

[Bhacaz/docs-as-code-confluence-demo](https://github.com/Bhacaz/docs-as-code-confluence-demo)

## Dry-run / Preview mode

You can generate HTML files locally without publishing to Confluence.

```yml
- name: Preview Docs as HTML
  uses: Bhacaz/docs-as-code-confluence@v3
  with:
    folder: docs
    dry-run: true
    preview-output-folder: preview-html
```

When `dry-run: true`, Confluence credentials and destination inputs are not required.

## Run locally (without GitHub Actions)

`@actions/core` reads inputs from environment variables named `INPUT_<NAME>`. For local execution,
you can use underscore names (for example `INPUT_DRY_RUN`, `INPUT_SPACE_KEY`).

PowerShell example:

```powershell
$env:INPUT_FOLDER = "docs" # avoid trailing slash/backslash
$env:INPUT_DRY_RUN = "true"
$env:INPUT_PREVIEW_OUTPUT_FOLDER = "preview-html"
node index.js
```

Publish mode example (PowerShell):

```powershell
$env:INPUT_FOLDER = "docs" # avoid trailing slash/backslash
$env:INPUT_DRY_RUN = "false"
$env:INPUT_USERNAME = "abc@xyz.com"
$env:INPUT_PASSWORD = "<api-token>"
$env:INPUT_CONFLUENCE_BASE_URL = "https://mydomain.atlassian.net/wiki"
$env:INPUT_SPACE_KEY = "~1234"
$env:INPUT_PARENT_PAGE_ID = "123456789"
node index.js
```

## Alternatives

* [markdown-confluence/publish-action](https://github.com/markdown-confluence/publish-action)
* [mbovo/mark2confluence](https://github.com/mbovo/mark2confluence)

## Development

**Test**

```bash
npm run test
```

**Build**

```bash
npm run build
```
