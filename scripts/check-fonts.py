"""Check GSUB feature tags in the font."""
import os
from fontTools.ttLib import TTFont

path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "node_modules", "@fontsource-variable",
    "material-symbols-outlined", "files",
    "material-symbols-outlined-latin-wght-normal.woff2"
)

font = TTFont(path)
gsub = font['GSUB'].table

print("Feature tags found:")
tags = set()
for feature in gsub.FeatureList.FeatureRecord:
    tags.add(feature.FeatureTag)
print(sorted(tags))

print(f"\nTotal lookups: {len(gsub.LookupList.Lookup)}")

# Check each lookup type
for i, lookup in enumerate(gsub.LookupList.Lookup):
    lt = lookup.LookupType
    for st in lookup.SubTable:
        st_type = type(st).__name__
        if i < 5:
            print(f"  Lookup {i}: Type={lt}, SubTable={st_type}")

# Check cmap for icon codepoints (Material Symbols uses codepoints in E000+ range)
cmap = font.getBestCmap()
icon_codepoints = {k: v for k, v in cmap.items() if k >= 0xE000}
print(f"\nIcon codepoints (Private Use Area): {len(icon_codepoints)}")

# Show a sample
sample = list(icon_codepoints.items())[:10]
for cp, name in sample:
    print(f"  U+{cp:04X} -> {name}")

font.close()
