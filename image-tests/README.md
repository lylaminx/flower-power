# Visual comparison harness

This directory defines repeatable render targets for the six hero species in
the photorealism plan plus structural-family benchmarks. Scenario configuration
is committed; third-party source photographs and generated PNGs are
intentionally ignored.

## Automated comparison

Install Chrome, then create or intentionally replace all local baselines with:

```sh
npm run test:visual:update
```

Compare the current renderer with those baselines using:

```sh
npm run test:visual
```

The comparison passes when no more than 1% of pixels differ. Failures, candidate
captures, and visual diffs are written to `image-tests/results/`.

To inspect a scenario manually, run `npm run dev`, set the browser viewport to
the scenario dimensions, and open `/visual-test/<scenario-id>`, such as
`/visual-test/poppy-studio-front`. Wait until `data-visual-test-ready` is `true`.

Baselines and test results remain local and are not committed. A baseline update
should be reviewed as carefully as a code change; do not use the update command
merely to make an unexplained regression pass.

The source of truth for seeds, camera transforms, lighting, and dimensions is
[`scenarios.json`](./scenarios.json). Do not change an existing target merely to
make a regression disappear; add a scenario or document an intentional baseline
update instead.

## Reference boards

See [`references/README.md`](./references/README.md) for the required views and
license/provenance record. Only add a source photograph to Git when its license
explicitly permits redistribution in this repository.
