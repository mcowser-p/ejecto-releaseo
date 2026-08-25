// .releaserc.js
module.exports = {
  branches: ["main"],
  tagFormat: `v\${version}`,
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "angular",
        releaseRules: [
          // Ignore commits without <scope>
          { scope: null, release: false },
          { breaking: true, release: "major" },
          { type: "feat", release: "minor" },
          { type: "fix", release: "patch" },
          { type: "docs", release: "patch" },
          { type: "patch", release: "patch" },
          { type: "chore", release: false },
        ],
      },
    ],
    // Renders the GitHub release body from the conventional commits in the
    // release. Without this plugin semantic-release emits an empty body, and
    // CHANGELOG.md points at the Releases page for the real notes.
    //
    // Deliberately unconfigured: the default preset is the
    // conventional-changelog-angular that this plugin itself depends on, so
    // the preset and the changelog writer can never drift apart. Pinning the
    // conventionalcommits preset separately did drift — it requires
    // conventional-changelog-writer@9+, the plugin ships writer@8, and the
    // release died at generateNotes. It also matches commit-analyzer above.
    "@semantic-release/release-notes-generator",
    [
      // Stamp the release version into galaxy.yml, build the collection
      // artifact, and publish it to Ansible Galaxy.
      "@semantic-release/exec",
      {
        prepareCmd:
          "sed -i 's/^version: .*/version: ${nextRelease.version}/' galaxy.yml && ansible-galaxy collection build --force",
        // Galaxy publish is optional: without the GALAXY_API_KEY secret the
        // GitHub release (tag + tarball) still happens and only the Galaxy
        // upload is skipped. A skipped version can be published later by
        // hand: ansible-galaxy collection publish <tarball> --token <key>.
        publishCmd:
          'if [ -n "$GALAXY_API_KEY" ]; then ansible-galaxy collection publish mcowser_p-ejecto_releaseo-${nextRelease.version}.tar.gz --token "$GALAXY_API_KEY"; else echo "::warning::GALAXY_API_KEY not set — GitHub release only, Galaxy publish skipped"; fi',
      },
    ],
    [
      "@semantic-release/github",
      {
        successCommentCondition: false,
        failCommentCondition: false,
        assets: [
          { path: "mcowser_p-ejecto_releaseo-*.tar.gz", label: "Ansible collection (mcowser_p.ejecto_releaseo)" },
        ],
      },
    ],
  ],
};
