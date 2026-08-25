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

Override any of them from the command line, for example to retarget the
destination:

```bash
ansible-playbook -i inventory mcowser_p.ejecto_releaseo.deploy \
  -e @examples/jq.yml -e dest=/opt/bin
```
