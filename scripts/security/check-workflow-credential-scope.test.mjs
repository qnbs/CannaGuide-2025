import assert from 'node:assert/strict'
import { test } from 'node:test'
import { violationsInTree, violationsInWorkflow } from './check-workflow-credential-scope.mjs'

test('live workflows keep privileged secrets off pull_request and unguarded dispatch', () => {
    assert.deepEqual(violationsInTree(process.cwd()), [])
})

test('a pull_request job that reads the Cloudflare token fails', () => {
    const text = `
on:
    pull_request:
        branches: [main]

jobs:
    preview:
        runs-on: ubuntu-latest
        steps:
            - name: Deploy
              env:
                  CLOUDFLARE_API_TOKEN: \${{ secrets.CLOUDFLARE_API_TOKEN }}
              run: echo deploy
`
    const problems = violationsInWorkflow('preview.yml', text)
    assert.equal(problems.length, 1)
    assert.match(problems[0], /preview\.yml job preview reads CLOUDFLARE_API_TOKEN/)
})

test('a workflow_run job in a pull_request workflow may read the token', () => {
    const text = `
on:
    pull_request:
    workflow_run:
        workflows: [CI]
        types: [completed]

jobs:
    deploy:
        if: github.event_name == 'workflow_run'
        runs-on: ubuntu-latest
        steps:
            - env:
                  CLOUDFLARE_API_TOKEN: \${{ secrets.CLOUDFLARE_API_TOKEN }}
              run: echo deploy
`
    assert.deepEqual(violationsInWorkflow('deploy.yml', text), [])
})

test('workflow_dispatch of a release secret without a main ref guard fails', () => {
    const text = `
on:
    workflow_dispatch:

jobs:
    publish:
        if: github.event_name == 'workflow_dispatch'
        runs-on: ubuntu-latest
        steps:
            - env:
                  RELEASE_PAT: \${{ secrets.RELEASE_PAT }}
              run: echo tag
`
    const problems = violationsInWorkflow('release.yml', text)
    assert.equal(problems.length, 1)
    assert.match(problems[0], /without a main ref guard/)
})

test('a main ref guard on the job if is accepted, a comment is not', () => {
    const guarded = `
on:
    push:
    workflow_dispatch:

jobs:
    publish:
        if: github.event_name == 'push' || (github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main')
        runs-on: ubuntu-latest
        steps:
            - env:
                  RELEASE_PAT: \${{ secrets.RELEASE_PAT }}
              run: echo tag
`
    assert.deepEqual(violationsInWorkflow('release.yml', guarded), [])

    const commentOnly = guarded.replace(
        "github.ref == 'refs/heads/main')",
        "github.ref == 'refs/heads/main') # guard stays on this line",
    )
    // The replacement above still leaves the guard in the if. Remove it from the if
    // and mention it only in a later comment.
    const commented = `
on:
    workflow_dispatch:

jobs:
    publish:
        runs-on: ubuntu-latest
        steps:
            # github.ref == 'refs/heads/main'
            - env:
                  RELEASE_PAT: \${{ secrets.RELEASE_PAT }}
              run: echo tag
`
    assert.equal(violationsInWorkflow('release.yml', commentOnly).length, 0)
    assert.equal(violationsInWorkflow('release.yml', commented).length, 1)
})

test('an or always() path does not satisfy the dispatch or pull_request guard', () => {
    const dispatch = `
on:
    workflow_dispatch:

jobs:
    publish:
        if: (github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main') || always()
        runs-on: ubuntu-latest
        steps:
            - env:
                  RELEASE_PAT: \${{ secrets.RELEASE_PAT }}
              run: echo tag
`
    assert.match(violationsInWorkflow('release.yml', dispatch).join('\n'), /main ref guard/)

    const preview = `
on:
    pull_request:

jobs:
    deploy:
        if: github.event_name == 'workflow_run' || always()
        runs-on: ubuntu-latest
        steps:
            - env:
                  CLOUDFLARE_API_TOKEN: \${{ secrets.CLOUDFLARE_API_TOKEN }}
              run: echo deploy
`
    assert.match(violationsInWorkflow('deploy.yml', preview).join('\n'), /pull_request/)
})

test('flow-style triggers, two-space jobs, indexed secrets, and inherit fail closed', () => {
    const flow = `
on: [pull_request]
jobs:
    preview:
        runs-on: ubuntu-latest
        steps:
            - env:
                  CLOUDFLARE_API_TOKEN: \${{ secrets['CLOUDFLARE_API_TOKEN'] }}
              run: echo deploy
`
    assert.match(violationsInWorkflow('flow.yml', flow).join('\n'), /pull_request/)

    const narrow = `
on:
  pull_request:

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - env:
          RELEASE_PAT: \${{ secrets["RELEASE_PAT"] }}
        run: echo tag
`
    assert.match(violationsInWorkflow('narrow.yml', narrow).join('\n'), /pull_request/)

    const inherited = `
on:
    pull_request:

jobs:
    call:
        uses: qnbs/CannaGuide-2025/.github/workflows/deploy-cloudflare.yml@main
        secrets: inherit
`
    assert.match(violationsInWorkflow('call.yml', inherited).join('\n'), /inherited secrets/)

    const dynamic = `
on:
    pull_request:

jobs:
    preview:
        runs-on: ubuntu-latest
        steps:
            - env:
                  TOKEN: \${{ secrets[vars.SECRET_NAME] }}
              run: echo deploy
`
    assert.match(
        violationsInWorkflow('dynamic.yml', dynamic).join('\n'),
        /unresolved secrets index/,
    )

    const opaque = `
on: { pull_request: {} }
jobs:
    preview:
        steps:
            - env:
                  SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
              run: echo scan
`
    assert.match(
        violationsInWorkflow('opaque.yml', opaque).join('\n'),
        /unsupported workflow shape/,
    )
})

test('an identifier comparison is not treated as unreachable', () => {
    const text = `
on:
    pull_request:

jobs:
    preview:
        if: github.event_name == inputs.mode
        runs-on: ubuntu-latest
        steps:
            - env:
                  CLOUDFLARE_API_TOKEN: \${{ secrets.CLOUDFLARE_API_TOKEN }}
              run: echo deploy
`
    assert.match(violationsInWorkflow('preview.yml', text).join('\n'), /pull_request/)
})

test('a secret outside jobs is visible to a pull_request job', () => {
    const text = `
on:
    pull_request:

concurrency:
    group: \${{ secrets.CLOUDFLARE_API_TOKEN }}

jobs:
    preview:
        runs-on: ubuntu-latest
        steps:
            - run: echo deploy
`
    assert.match(violationsInWorkflow('preview.yml', text).join('\n'), /CLOUDFLARE_API_TOKEN/)
})

test('a workflow-level env secret is visible to a pull_request job', () => {
    const text = `
on:
    pull_request:

env:
    CLOUDFLARE_API_TOKEN: \${{ secrets.CLOUDFLARE_API_TOKEN }}

jobs:
    build:
        runs-on: ubuntu-latest
        steps:
            - run: echo "\$CLOUDFLARE_API_TOKEN"
`
    assert.match(violationsInWorkflow('preview.yml', text).join('\n'), /CLOUDFLARE_API_TOKEN/)

    const guarded = `
on:
    workflow_dispatch:

env:
    RELEASE_PAT: \${{ secrets.RELEASE_PAT }}

jobs:
    publish:
        if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'
        runs-on: ubuntu-latest
        steps:
            - run: echo ok
`
    assert.deepEqual(violationsInWorkflow('release.yml', guarded), [])
})

test('GITHUB_TOKEN on pull_request is not a privileged secret', () => {
    const text = `
on:
    pull_request:

jobs:
    label:
        runs-on: ubuntu-latest
        steps:
            - env:
                  TOKEN: \${{ secrets.GITHUB_TOKEN }}
              run: echo ok
`
    assert.deepEqual(violationsInWorkflow('label.yml', text), [])
})
