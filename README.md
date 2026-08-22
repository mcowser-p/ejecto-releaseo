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

## After the files land

- `ejecto_releaseo_service` — restarted (handler) only when something changed,
  then health-checked (`ejecto_releaseo_health_check`, on by default)
- `ejecto_releaseo_command` — arbitrary command run when something changed

## Releasing

Conventional commits on `main` drive semantic-release: version stamped into
`galaxy.yml`, tarball attached to the GitHub release, and published to
Ansible Galaxy automatically.

## License

Apache-2.0
