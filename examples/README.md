# Example variable files

Each file is a ready-to-run `-e @file` for the bundled deploy playbook,
against a real public repository — no token needed, since all four sources
are public.

```bash
ansible-playbook -i inventory mcowser_p.ejecto_releaseo.deploy \
  -e @examples/jq.yml
```

| File | Shows |
| --- | --- |
| [jq.yml](jq.yml) | A single static binary, renamed on the way in. |
| [prometheus.yml](prometheus.yml) | A tarball unpacked into place plus a service restart, with a glob matching the version in the asset name. |
| [node-exporter.yml](node-exporter.yml) | `version: latest` resolved at run time, so reruns are no-ops until upstream publishes. |
| [caddy-config.yml](caddy-config.yml) | Branch mode — config from a repo tree, with trailing-slash contents semantics. |
| [node-exporter-service-user.yml](node-exporter-service-user.yml) | Ownership — deploying under a dedicated service account, with a private destination directory. |

## Ownership and permissions

`owner` and `group` apply to the destination directory and to everything the
role installs. **The role does not create the user or group** — if the
account does not exist on the target, the deploy fails with a chown error.
Create it in a `pre_tasks` block, as
[node-exporter-service-user.yml](node-exporter-service-user.yml) shows.

Modes are less uniform than ownership, because the role hands the work to
different modules depending on what it is installing:

| What | `owner` / `group` | Mode |
| --- | --- | --- |
| The destination directory | applied | `dir_mode` |
| A release asset copied as a plain file | applied | `mode` |
| A release asset unarchived | applied | preserved from inside the archive |
| A branch tree copied to the target | applied | preserved from the source tree |
| Anything on Windows | not applied | not applied |

Two consequences worth knowing before you set these:

- **`mode` does not reach the contents of an archive.** Unarchiving keeps the
  modes recorded in the tarball, which is usually what you want — a binary
  that ships executable stays executable. Setting `mode: "0640"` alongside
  `unarchive: true` changes nothing inside the extracted tree.
- **`dir_mode` is separate from `mode` on purpose.** A file mode is the wrong
  shape for a directory: `0640` on a directory makes it non-traversable, so
  the service that owns it cannot read its own files. Use `dir_mode: "0750"`
  for a deploy that should not be world-readable.

On Windows the role installs with `win_copy` and `win_file`, which take no
POSIX ownership or mode — set ACLs separately if you need them.

Override any of them from the command line, for example to retarget the
destination:

```bash
ansible-playbook -i inventory mcowser_p.ejecto_releaseo.deploy \
  -e @examples/jq.yml -e dest=/opt/bin
```
