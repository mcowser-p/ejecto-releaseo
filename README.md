# presto-deployo 🎩✨

**Presto! Deployo!** — an Ansible collection that pulls files from a GitHub
**branch or release** and lands them on **Linux and Windows** hosts, then
restarts a service or runs a command. One role, four ways to authenticate,
zero hand-rolled download scripts.

```bash
ansible-galaxy collection install mcowser_p.presto_deployo
```

## Quick start

```yaml
- hosts: app_servers
  serial: 1                      # rolling, one host at a time
  roles:
    - role: mcowser_p.presto_deployo.deploy
      vars:
        presto_deployo_repo_owner: sudo-whodo
        presto_deployo_repo_name: my-app
        presto_deployo_version: latest          # or a tag: v2.3.1
        presto_deployo_assets:
          - name: "my-app-linux-*.tar.gz"       # glob against release assets
            unarchive: true
        presto_deployo_dest: /opt/my-app
        presto_deployo_service: my-app          # restarted only when files changed
```

Windows targets work with the same vars — the role branches on
`ansible_os_family` (`win_get_url`/`win_unzip`/`win_copy`, service restarts
via `win_service`).

### Deploy a branch instead of a release

```yaml
presto_deployo_source: branch
presto_deployo_version: main
presto_deployo_paths:                # omit to deploy the whole tree
  - path: config/
    dest: /etc/my-app
```

## Authentication

`presto_deployo_auth: auto` (the default) picks the first available:

| Method | Vars | Notes |
| --- | --- | --- |
| PAT / explicit token | `presto_deployo_token` | |
| GitHub App | `presto_deployo_app_id`, `_app_installation_id`, `_app_private_key` | installation token minted on the controller |
| Workflow token | *(none)* | the runner's `GITHUB_TOKEN` env var is picked up automatically |
| Anonymous | *(none)* | public repos only |
| Deploy key | `presto_deployo_deploy_key` + `presto_deployo_auth: deploy_key` | `source: branch` only — deploy keys speak git, not the REST API |

In GitHub Actions this means zero configuration for same-org repos:

```yaml
- name: Deploy
  run: ansible-playbook -i inventory deploy.yml
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## After the files land

- `presto_deployo_service` — restarted (handler) only when something changed,
  then health-checked (`presto_deployo_health_check`, on by default)
- `presto_deployo_command` — arbitrary command run when something changed

## Releasing

Conventional commits on `main` drive semantic-release: version stamped into
`galaxy.yml`, tarball attached to the GitHub release, and published to
Ansible Galaxy automatically.

## License

Apache-2.0
