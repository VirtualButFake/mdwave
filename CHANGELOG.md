# 1.3.0
Reworked API Reference organization - now runs through tags instead of through the configuration option `classSections`, done to make it easier to configure classes without having to go to the config, and allowing you to specify a group of a class right in the code, which is more in-line with how Moonwave works.

Added isRoot to Docs.

# 1.3.3
Fixed several bugs:
- Base url is now prepended to class links
- Clean URL support for VitePress

# 1.3.6
- Added support for @error tag
- Fixed bug on type parsing where commas would get added without a need to
- Fixed bug where skipped types would cause an empty header to appear

# 1.3.7
Improved ``mdwave dev``:
- ``docs`` folders are now properly auto-updated and changes to the filesystem will no longer crash the server

# 1.3.8
- Fix a lot of bugs
- Fix issue where a code block would show up twice

(this version was stupidly frustrating to make)