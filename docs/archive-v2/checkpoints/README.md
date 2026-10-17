# V2 checkpoint manifests

These JSON files are preserved byte for byte from the V2 checkpoint. They contain dated paths and hashes, not current filesystem links or file backups.

- [Pre-cleanup state](2026-10-17-v2-state.json): original 370-file inventory and earlier Git/index identity.
- [Cleanup evidence](2026-10-17-v2-cleanup.json): previous cleanup counts, selected evidence hashes and preservation checks.
- [Root checkpoint](../../../CHECKPOINT-V2.md): historical context and implementation boundary.
- [Relocation map](../relocation-map.md): current locations for retained files. Manifest entries for previously removed QA output remain historical and intentionally unresolved.

The manifests can move safely because no active script consumes them by path; documentation links have been updated. Their embedded historical filenames and Git identities must not be rewritten to describe this V3 reorganization.
