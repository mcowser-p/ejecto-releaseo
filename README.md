# ejecto-releaseo ⏏️🚀

**Ejecto! Releaseo!** — an Ansible collection that pulls files from a GitHub
**branch or release** and lands them on **Linux and Windows** hosts, then
restarts a service or runs a command. One role, four ways to authenticate,
zero hand-rolled download scripts.

```bash
ansible-galaxy collection install mcowser_p.ejecto_releaseo
```

## Quick start

```yaml
- hosts: app_servers
  become: true                   # the role itself never escalates — do it here (Linux)
  serial: 1                      # rolling, one host at a time
  roles:
    - role: mcowser_p.ejecto_releaseo.ejecto_releaseo
      vars:
        ejecto_releaseo_repo_owner: mcowser-p
        ejecto_releaseo_repo_name: my-app
        ejecto_releaseo_version: latest          # or a tag: v2.3.1
        ejecto_releaseo_assets:
          - name: "my-app-linux-*.tar.gz"       # glob against release assets
            unarchive: true
        ejecto_releaseo_dest: /opt/my-app
        ejecto_releaseo_service: my-app          # restarted only when files changed
```

Windows targets work with the same vars — the role branches on
`ansible_os_family` (`win_get_url`/`win_unzip`/`win_copy`, service restarts
via `win_service`).

### Windows connections: WinRM and SSH both work

The role is connection-agnostic — `win_*` modules run over either
transport. CI tests both.

```ini
# WinRM
[windows:vars]
ansible_connection=winrm
ansible_port=5986
ansible_winrm_transport=ntlm        # or kerberos/credssp/basic

# OpenSSH (Windows Server 2019+, PowerShell as the default ssh shell)
[windows:vars]
ansible_connection=ssh
ansible_shell_type=powershell
```

### Deploy a branch instead of a release

```yaml
ejecto_releaseo_source: branch
ejecto_releaseo_version: main
ejecto_releaseo_paths:                # omit to deploy the whole tree
  - path: config/
    dest: /etc/my-app
```

## As a GitHub Action

Deploy to your hosts straight from a workflow. Point it at an inventory in
your checkout; the role does the fetching and landing as usual.

```yaml
- uses: actions/checkout@v5

- uses: mcowser-p/ejecto-releaseo@v1
  with:
    inventory: inventory/prod.ini
    ssh_private_key: ${{ secrets.DEPLOY_KEY }}
    ssh_known_hosts: ${{ secrets.KNOWN_HOSTS }}   # ssh-keyscan output
    repo_owner: mcowser-p
    repo_name: my-app
    version: latest
    assets: |
      - name: "my-app-linux-*.tar.gz"
        unarchive: true
    dest: /opt/my-app
    service: my-app
```

`assets`, `paths` and `extra_vars` take YAML (or JSON) exactly as the role
vars do. Every role variable has a matching input; `extra_vars` is merged
last for anything not exposed directly.

The source repo needs no configuration when it is the same repo or same org
— the workflow's ambient `GITHUB_TOKEN` is picked up automatically. Set the
`token` input to a PAT only for cross-org private sources.

**Host keys are verified by default.** Supply `ssh_known_hosts` with
`ssh-keyscan` output for your targets. The Action fails with a clear message
rather than silently trusting whatever answers, so if you genuinely have
ephemeral targets, opt out explicitly with `ssh_host_key_checking: "false"`.
The private key is written to a `0600` file under `RUNNER_TEMP` — outside
the workspace, so an artifact upload cannot sweep it up — and goes away with
the job.

Narrow a run to part of the inventory with `limit: web`.

## Example variable files

[`examples/`](examples/) has ready-to-run var files against real public
repos — a single binary, a tarball plus service restart, `latest`
resolution, and branch-mode config. Run one with:

```bash
ansible-playbook -i inventory mcowser_p.ejecto_releaseo.deploy \
  -e @examples/prometheus.yml
```

## Authentication

`ejecto_releaseo_auth: auto` (the default) picks the first available:

| Method | Vars | Notes |
| --- | --- | --- |
| PAT / explicit token | `ejecto_releaseo_token` | |
| GitHub App | `ejecto_releaseo_app_id`, `_app_installation_id`, `_app_private_key` | installation token minted on the controller |
| Workflow token | *(none)* | the runner's `GITHUB_TOKEN` env var is picked up automatically |
| Anonymous | *(none)* | public repos only |
| Deploy key | `ejecto_releaseo_deploy_key` + `ejecto_releaseo_auth: deploy_key` | `source: branch` only — deploy keys speak git, not the REST API |

In GitHub Actions this means zero configuration for same-org repos:

```yaml
- name: Deploy
  run: ansible-playbook -i inventory deploy.yml
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Idempotence: the version marker

The role records what it deployed in `<dest>/.ejecto_releaseo.version`
(release tag + asset ids, or branch commit sha). On the next run it
resolves the desired version first and **skips every download and install
when the target is already current** — reruns are cheap, and a `latest`
deploy only acts when a new release actually exists. Override with
`ejecto_releaseo_force: true`.

## After the files land

- `ejecto_releaseo_service` — restarted (handler) only when something changed,
  then health-checked (`ejecto_releaseo_health_check`, on by default)
- `ejecto_releaseo_command` — arbitrary command run when something changed

## Releasing

Conventional commits on `main` drive semantic-release: version stamped into
`galaxy.yml`, tarball attached to the GitHub release, and published to
Ansible Galaxy automatically.

## Contributing

Commit messages drive releases here — semantic-release reads them to pick
the next version, and a commit **without a scope is ignored entirely**, so
`feat: thing` silently costs you a release where `feat(role): thing` cuts
one. CI checks every commit on a Linux runner, so the verdict is identical
whatever you develop on.

To get the same check locally before the commit lands — on Windows, macOS
or Linux alike:

```bash
npm install
```

That installs the `commit-msg` hook. It runs through Git for Windows' own
bundled `sh`, so there is no separate Windows path to keep working. To
check a message by hand:

```bash
npx commitlint --edit .git/COMMIT_EDITMSG
```

Dependabot PRs are approved and merged automatically once the required
checks pass, and never merged when a check fails. Major version bumps are
the exception: they are assigned to the repository owner for review instead
of being merged, since those are the ones that actually break things.

## License

Apache-2.0
