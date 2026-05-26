# How to Contribute

Thanks for contributing to my passion project, `gbajs3`!

This repository is a monorepo containing the browser client and supporting services.

Top-level services include:

- `gbajs3/` - main frontend application
- `auth/` - authentication service
- `admin/` - admin action+admin UI
- `postgres/` - database service
- `shepherd/` - supporting swarm service

For setup and local development, start with the root `README.md` and then the service specific `README.md` for the area you are changing.

## Issues

Please use the available issue templates if they apply, and fill them out to the best of your ability.

Current templates include:

- bug reports
- feature requests

## Pull Requests

When opening a pull request:

- use a clear title and description explaining the problem being solved
- call out any tradeoffs, limitations, or follow-up work
- include screenshots or recordings for UI changes when possible
- link related issues or discussions

Before requesting review, make sure:

- relevant ci checks are passing
- documentation has been updated if needed
- generated files are reviewed

## Contributor Credit

This repository uses `all-contributors-cli` to manage the contributors metadata.

From the monorepo root:

Use the following command when crediting a new contributor or adding a new contribution type for an existing contributor:

```zsh
npx all-contributors-cli add <github-username> <contribution>
```

To regenerate contributor output, run the following command to rebuild the contributor badge and table from `.all-contributorsrc`:

```zsh
npx all-contributors-cli generate
```

Contribution types use the All Contributors spec and [emoji key](https://allcontributors.org/en/reference/emoji-key/).
