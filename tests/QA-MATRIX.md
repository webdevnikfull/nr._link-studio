# Link Studio — image-to-URL QA fixtures

All files in `fixtures/` are synthetic and contain no user images or personal metadata. `create_fixtures.py` reproduces them with Pillow. `fixture-manifest.json` records exact byte counts, SHA-256 hashes, and successful Pillow decodes. This is a proposed manual test matrix, not a record of executed browser tests.

## Manual checks

| Area | Action | Expected behavior |
|---|---|---|
| Navigation | Open each of the three tabs directly and navigate between them | Exactly one active tab; correct heading, input, result, and actions for each mode; QR and shortening still work as before |
| Locales | Repeat image selection, validation, upload, copy, and QR handoff in PL / EN / DE | No missing translation keys or mixed-language status/error text; locale survives tab navigation and QR handoff |
| Appearance | Use both themes at 360px, 390px, 768px, and desktop widths | Three tabs remain usable; no page overflow; focus indicators and errors are readable; preview preserves image ratio |
| Input | Select PNG using picker, then drag/drop another image | Visible filename, file size, and preview update together; stale URL/actions are cleared |
| Common formats | Upload `synthetic.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.bmp`, `.ico` | Accepted according to documented format policy; unsupported browser previews have a clear fallback; download preserves valid bytes |
| Additional formats | Try `synthetic.avif`, `.tiff`, `.tif` | Upload acceptance and preview support are handled separately; unavailable preview does not imply an invalid file |
| Transparency / animation | Use `transparent.png` and `synthetic.gif` | Alpha is visible against the preview background; GIF upload/download remains animated unless conversion is explicitly explained |
| Static SVG | Use `safe.svg` | Either safely accepted or intentionally rejected with a clear supported-format message |
| Active SVG | Use `unsafe-script.svg` and `unsafe-external.svg` | No script execution or remote asset fetch. Reject, sanitize, or rasterize before issuing a public URL; do not expose active SVG on the app origin |
| False extension | Use `fake.png`, `empty.png`, `truncated.jpg` | Clear error, no success badge, no URL or QR handoff; reselecting a valid image recovers |
| MIME mismatch | Use `renamed-jpeg.png` (JPEG bytes with PNG extension) | Server verifies content; either rejects mismatch or serves with detected JPEG MIME. Never trust the extension alone |
| Limits | Test exact configured size boundary and one byte over it | Client and server limits agree; human-readable localized message; no partial public asset |
| Concurrency | Select a second file while the first preview/upload is running | Old operation cannot overwrite the new file/result; status and progress represent the current operation |
| Failure | Test unavailable API, timeout, offline, and non-JSON error response | Action recovers from busy state, localized error appears, and retry succeeds without duplicate/stale output |
| Public URL | Open issued HTTPS link in another browser/session/device | Link retrieves the image without relying on the creator’s local state; correct image MIME; expiration/retention explained if applicable |
| No backend configured | Open static project with no upload endpoint | UI explains what is required for a public URL; never presents `blob:` or `data:` as a globally shareable hosted URL |
| Copy | Copy resulting URL, then deny clipboard permission | Success only after clipboard resolves; denial leaves manually selectable URL and displays recovery hint |
| QR handoff | Create QR from an uploaded image result | Correct HTTP(S) image URL is encoded; current locale retained; code downloads remain available |
| Accessibility | Complete selection, submit, reset, and copy using keyboard; inspect labels/live status | Accessible file input, visible focus, no keyboard trap, meaningful errors/status announced, no repeated announcements while idle |
| Reset | Clear image and select the same file again | Object URLs/resources released, previous output hidden, same filename triggers a new selection |

## Format and MIME notes

- Common MIME values: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/bmp`, `image/tiff`, `image/avif`, `image/svg+xml`. ICO may be reported as `image/x-icon` or `image/vnd.microsoft.icon`. Some operating systems/browser combinations return an empty `File.type`.
- `accept="image/*"` is a file-picker hint, not a security boundary or promise that every image codec is previewable. Backend content validation remains required.
- AVIF fixtures are valid according to the installed Pillow decoder; actual browser preview and hosting support still require testing in supported browsers.
- TIFF files are valid according to Pillow. Do not assume `<img>` preview support across browsers. Preserve original upload if supported and show a preview-unavailable fallback when necessary.
- No HEIC fixture is included: the available Pillow installation exposes no HEIC encoder. A MIME declaration (`image/heic` / `image/heif`) does not establish decode support. If offered, test a real synthetic HEIC using a supported encoder/decoder and handle browser preview failure explicitly.
- Server MIME configuration must support each format that the server accepts. Unknown codecs should be rejected or intentionally provided as download-only, rather than claimed to be universally supported.
