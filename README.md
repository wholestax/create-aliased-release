# Create Aliased Release

This Action creates a tag and release when you merge code. It also maintains aliases for major version releases, like v1, that point the most recent minor and patch version for that major release.

If you bump your released version from v1.1.6 to v1.2.0 the alias v1 will be updated to match the v1.2.0 tag and release. The v1.1 alias will still point to v1.1.6 and a new v1.2 alias will be created and point to v1.2.0.

If you later release v1.1.7, the v1 will continue to point to v1.2.0, but v1.1 will be updated to point to v1.1.7.

vx.x always increments to the version being released
vx might not be updated if it already points to a more recent minor version.
