# setup-gli-action

![Linter](https://github.com/GreemDev/setup-gli-action/actions/workflows/linter.yml/badge.svg)
![CI](https://github.com/GreemDev/setup-gli-action/actions/workflows/ci.yml/badge.svg)
![Check dist/](https://github.com/GreemDev/setup-gli-action/actions/workflows/check-dist.yml/badge.svg)
![CodeQL](https://github.com/GreemDev/setup-gli-action/actions/workflows/codeql-analysis.yml/badge.svg)
![Coverage](./badges/coverage.svg)

This action installs a version of [GLI](https://github.com/GreemDev/GLI) for use
in your GitHub/Gitea/Forgejo Actions workflows. It is automatically added to the
PATH.

## Usage

See [action.yml](action.yml).

<!-- start usage -->

```yaml
- uses: GreemDev/setup-gli-action@v1
  with:
    # Specific version of GLI to use; do not specify for latest release.
    version: '3.0.4'

    # GitHub token for authentication. You only need this
    # if you're hitting ratelimits; GLI is not a private repo.
    token: ${{ github.token }}
```

<!-- end usage -->
