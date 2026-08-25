# ejecto_releaseo

Deploy files from a GitHub **branch or release** onto **Linux and Windows**
hosts, then restart a service or run a command.

This is the only role in the `mcowser_p.ejecto_releaseo` collection. See the
[collection README](../../README.md) for the full guide; this page is the
role reference.

## Requirements

- Ansible `>= 2.16`
- Collections: `community.general`, `ansible.windows`, `community.windows`
  (installed automatically with the collection)
- Windows targets work over either WinRM or SSH — the role is
  connection-agnostic

The role never escalates on its own. Use `become: true` on the play for
Linux targets that need it.

## Role Variables

### What to deploy

| Variable | Default | Description |
| --- | --- | --- |
| `ejecto_releaseo_repo_owner` | `""` | **Required.** GitHub org or user. |
| `ejecto_releaseo_repo_name` | `""` | **Required.** Repository name. |
| `ejecto_releaseo_source` | `release` | `release` (assets attached to a GitHub release) or `branch` (the repo tree at a ref). |
| `ejecto_releaseo_version` | `latest` | Release mode: a tag, or `latest` to resolve the newest release. Branch mode: the branch or ref. |
| `ejecto_releaseo_assets` | `[]` | Release mode. Items: `name` (exact filename or glob, first match wins), `dest`, `rename`, `unarchive` (auto-detected for `.tar.gz`/`.tgz`/`.zip`). |
| `ejecto_releaseo_paths` | `[]` | Branch mode. Items: `path`, `dest`. Empty list deploys the whole tree. A trailing slash on `path` copies the directory's *contents*; no slash copies the directory itself. |

### Where to put it

| Variable | Default | Description |
| --- | --- | --- |
| `ejecto_releaseo_dest` | `""` | **Required.** Target directory. |
| `ejecto_releaseo_owner` | `root` | Linux only. |
| `ejecto_releaseo_group` | `root` | Linux only. |
| `ejecto_releaseo_mode` | `"0755"` | Linux only. |

### Authentication

| Variable | Default | Description |
| --- | --- | --- |
| `ejecto_releaseo_auth` | `auto` | `auto`, `none`, `token`, `app`, or `deploy_key`. `auto` picks the first of: explicit token, GitHub App creds, the runner's `GITHUB_TOKEN`, anonymous. |
| `ejecto_releaseo_token` | `""` | PAT, or pass `GITHUB_TOKEN` via the environment. |
| `ejecto_releaseo_app_id` | `""` | GitHub App auth — all three App vars required. |
| `ejecto_releaseo_app_installation_id` | `""` | |
| `ejecto_releaseo_app_private_key` | `""` | Path to the PEM on the controller. |
| `ejecto_releaseo_deploy_key` | `""` | Path to the SSH private key on the controller. `source: branch` only — deploy keys speak git, not the REST API. |

### Idempotence and post-deploy actions

| Variable | Default | Description |
| --- | --- | --- |
| `ejecto_releaseo_force` | `false` | Redeploy even when the version marker says the target is current. |
| `ejecto_releaseo_service` | `""` | systemd unit (Linux) or service name (Windows), restarted only when files changed. Empty disables. |
| `ejecto_releaseo_command` | `""` | Command run when files changed, after the restart. Empty disables. |
| `ejecto_releaseo_health_check` | `true` | Verify the service is running after a restart. |
| `ejecto_releaseo_health_check_delay` | `10` | Seconds to wait before checking. |

The role records what it deployed in `<dest>/.ejecto_releaseo.version`
(release tag plus asset ids, or the branch commit sha) and skips every
download and install when the target is already current.

## Dependencies

None.

## Example Playbook

```yaml
- hosts: app_servers
  become: true
  serial: 1
  roles:
    - role: mcowser_p.ejecto_releaseo.ejecto_releaseo
      vars:
        ejecto_releaseo_repo_owner: mcowser-p
        ejecto_releaseo_repo_name: my-app
        ejecto_releaseo_version: latest
        ejecto_releaseo_assets:
          - name: "my-app-linux-*.tar.gz"
            unarchive: true
        ejecto_releaseo_dest: /opt/my-app
        ejecto_releaseo_service: my-app
```

Deploying a branch instead:

```yaml
- hosts: web
  roles:
    - role: mcowser_p.ejecto_releaseo.ejecto_releaseo
      vars:
        ejecto_releaseo_repo_owner: mcowser-p
        ejecto_releaseo_repo_name: my-app
        ejecto_releaseo_source: branch
        ejecto_releaseo_version: main
        ejecto_releaseo_paths:
          - path: config/
            dest: /etc/my-app
        ejecto_releaseo_dest: /opt/my-app
```

## License

Apache-2.0
