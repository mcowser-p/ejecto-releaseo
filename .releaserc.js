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
    [
      // Stamp the release version into galaxy.yml, build the collection
      // artifact, and publish it to Ansible Galaxy.
      "@semantic-release/exec",
      {
        // Fail the release BEFORE anything is tagged when the Galaxy key is
        // absent — a failed publish after tagging strands a half-release.
        verifyConditionsCmd:
          '[ -n "$GALAXY_API_KEY" ] || { echo "GALAXY_API_KEY secret is not set"; exit 1; }',
        prepareCmd:
          "sed -i 's/^version: .*/version: ${nextRelease.version}/' galaxy.yml && ansible-galaxy collection build --force",
        publishCmd:
          "ansible-galaxy collection publish mcowser_p-ejecto_releaseo-${nextRelease.version}.tar.gz --token $GALAXY_API_KEY",
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
