# Launch guide (plain English)

This is for the day you launch the SaaS Puppy directory. You do not need to write code. Each step says where to click or what to paste. Allow about an hour for everything, most of it waiting on websites.

Technical details are in [publishing.md](publishing.md). If a website has changed its menus, follow what it shows and keep the same goal.

## Before you start

- [ ] The directory is live at https://saaspuppy.com.
- [ ] The MCP address works. On GitHub, open the **Actions** tab, click **Check live endpoint** on the left, click **Run workflow**, then **Run workflow** again. After about two minutes the run shows a green tick if the live address works. Open it and look for `All good.` in the last step. A red cross means the site's MCP address is not answering yet.
- [ ] You have accounts on [GitHub](https://github.com) (done) and [npm](https://www.npmjs.com/signup) (free).

## Step 1: Fill in the repository's front page (5 minutes)

On https://github.com/rahulparathy/saas-puppy-mcp:

1. Click the small gear next to **About** on the right.
2. **Description:** `MCP server for SaaS Puppy: look up and compare free-tier developer tools from your AI assistant.`
3. **Website:** `https://saaspuppy.com`
4. **Topics:** `mcp`, `model-context-protocol`, `mcp-server`, `saas`, `free-tier`, `developer-tools`, `typescript`
5. Click **Save changes**.
6. Protect the `main` branch. Go to **Settings**, then **Rules**, then **Rulesets**, then **New ruleset**, then **New branch ruleset**. Name it `Protect main`, set **Enforcement status** to **Active**, click **Add target**, then **Include default branch**. Leave **Restrict deletions** and **Block force pushes** ticked. Do not tick **Require a pull request before merging**, because it stops you from saving changes straight to `main`. Click **Create**.
7. Before the npm release, replace the banner link in `README.md` with the full address `https://raw.githubusercontent.com/rahulparathy/saas-puppy-mcp/main/assets/banner.png`. The npm page cannot see files inside the repository, so a short path shows a broken image there. This only works once the repository is public.

## Step 2: Remove the pre-release note (2 minutes)

Open `README.md` on GitHub, click the pencil icon, delete the block that starts with `> **Pre-release.**`, and click **Commit changes**.

## Step 3: Make the repository public (1 minute)

1. **Settings**, then **General**, scroll to the bottom to **Danger Zone**.
2. Click **Change visibility**, choose **Make public**, and confirm.

Do this only after Step 2. Once public, anyone can see the code and history.

After the repository is public, go to **Settings**, then **General**, scroll to **Social preview**, click **Edit**, then **Upload an image** and choose `assets/social-preview.png`. GitHub hides this option while the repository is private. It is the picture shown when someone shares the link.

## Step 4: Publish to npm (10 minutes)

1. Log in at https://www.npmjs.com, click your picture, then **Access Tokens**, then **Generate New Token**, then **Granular Access Token**.
2. Name it `saas-puppy-mcp`. Under **Permissions**, choose **Read and write**. Choose **All packages** (the package does not exist yet). Switch on **Bypass two-factor authentication**, because the automatic publish cannot type a code. Set the longest expiry offered and note the date, since an expired token makes the next release fail and you will need to make a new one. Click **Generate** and copy the token straight away, because npm shows it only once.
3. On GitHub, open the repository, **Settings**, **Secrets and variables**, **Actions**, **New repository secret**. Name: `NPM_TOKEN`. Value: the token. Click **Add secret**.
4. Go to **Releases**, then **Draft a new release**. In **Choose a tag**, type `v0.1.0` and click **Create new tag**. Title it `v0.1.0`. Click **Publish release**.
5. Open the **Actions** tab. A run called **Release** starts. Wait for a green tick (a few minutes). It publishes the package to npm and lists it in the official MCP Registry.
6. Check https://www.npmjs.com/package/saas-puppy-mcp. If the page exists, it worked.

If the run turns red, open it, copy the error text, and ask Claude to fix it. The most common cause is an npm token with too few permissions, or the name `saas-puppy-mcp` already being taken.

## Step 5: Submit to the other directories (30 minutes)

Use the same short text everywhere:

- **Name:** SaaS Puppy
- **One line:** Look up or compare free-tier developer tools, with the catch spelled out.
- **Address:** `https://saaspuppy.com/MCP`
- **Install:** `npx -y saas-puppy-mcp`
- **Repository:** https://github.com/rahulparathy/saas-puppy-mcp
- **Needs an account or key:** No

Submit on: [Smithery](https://smithery.ai), [Glama](https://glama.ai), [mcp.so](https://mcp.so), [PulseMCP](https://www.pulsemcp.com), [mcpservers.org](https://mcpservers.org), [Cursor directory](https://cursor.directory). Each has a "submit" or "add server" button. The list in [publishing.md](publishing.md) has notes on each.

## Step 6: Tell people

- Add the MCP address to the SaaS Puppy site, for example on a "Use SaaS Puppy in your AI app" page.
- Post it. The banner is `assets/banner.png` (use `assets/social-preview.png` where an image file is needed).

## Later: releasing an update

1. Ask Claude to change the code and bump the version number.
2. Create a release on GitHub with a new tag such as `v0.1.1`.
3. The **Release** run publishes it automatically.

## If something goes wrong

- **Nothing happens when you ask your AI about tools.** Run `npx -y saas-puppy-mcp --check` and read the line that says `FAIL`.
- **A directory rejects the listing.** Read their message. It usually asks for a clearer description or a working link. Fix it in the form and resubmit.
- **You are unsure about a step.** Stop and ask. Nothing in this guide is hard to undo except making the repository public, and even that can be reversed in the same Danger Zone.
