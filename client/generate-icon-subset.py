"""
Generate a compact Material Symbols Outlined subset .woff2.

Strategy (3-pass):
1. Subset to our codepoints + rlig
2. Prune rlig to keep only our icon ligatures
3. Save to uncompressed TTF, then re-subset (to garbage-collect orphan glyphs)
"""

import os, sys, tempfile
from fontTools.ttLib import TTFont
import subprocess

# ── Icon names used in the project ──────────────────────────────────────
# Exhaustive list extracted from all .jsx/.js files in src/
ICONS = sorted(set([
    # --- Inline JSX usage (>icon_name</span>) ---
    "add", "add_circle", "admin_panel_settings", "apple", "arrow_back", "arrow_forward",
    "assignment", "auto_stories", "badge", "block","bolt", "mark_email_read",
    "calendar_today", "cancel", "category", "check", "check_circle","checklist",
    "chevron_right", "close", "delete", "edit", "error",
    "expand_less", "expand_more", "extension", "fast_forward", "favorite",
    "group", "group_add", "group_off", "groups",
    "history", "hourglass_empty", "hub",
    "image_not_supported", "info",
    "label", "language", "leaderboard", "local_library", "lock", "logout",
    "mail", "menu",
    "person", "person_add", "person_off", "person_remove",
    "progress_activity", "public",
    "rocket_launch",
    "save", "school", "sentiment_dissatisfied", "settings",
    "sports_esports", "sync", "sync_alt",
    "tag", "task_alt", "translate", "trending_up",
    "verified", "volume_off", "volume_up", "warning",

    # --- config/navigation.js ---
    "article", "dashboard", "home", "library_books", "login",
    "map", "shield_person",

    # --- config/activityConfig.js ---
    "compare_arrows", "drag_indicator", "emoji_events",
    "lightbulb", "psychology", "quiz", "search", "style", "timer", "grid_on", "gesture",
    

    # --- pages/AuthPage.jsx (dynamic) ---
    "face", "expand_more", "lock", "badge",

    # --- pages/Register.jsx ---
    "cast_for_education", "account_circle",

    # --- pages/NosotrosPage.jsx ---
    "child_care", "code", "diversity_3",

    # --- pages/TeacherDashboard.jsx (icon= props) ---
    "notification_important",

    # --- pages/visitor/VisitorDashboard.jsx ---
    "fact_check", "local_fire_department", "menu_book",

    # --- components/landing/CommonPhrases.jsx ---
    "wb_sunny", "sentiment_satisfied", "record_voice_over",
    "dark_mode", "waving_hand",

    # --- components/landing/CulturalContent.jsx ---
    "chat_bubble", "music_note", "edit_note",

    # --- components/landing/GamesShowcase.jsx ---
    "casino", "route", "link",
    "trophy",
    # --- components/landing/CategoriesMarquee.jsx ---
    "pets", "palette", "pin", "nutrition",
    "accessibility_new", "family_restroom", "checkroom", "cottage",
    "restaurant", "park", "mood", "calendar_month", "event",

    # --- components/landing/MultimodalSection.jsx ---
    "image", "description",

    # --- components/landing/AboutTeaser.jsx ---
    # (code, child_care, school, diversity_3 already above)

    # --- components/Dashboard/LearningActivities.jsx ---
    "mic",

    # --- components/Dashboard/DashboardSidebar.jsx ---
    # (menu_book, sports_esports, trending_up, settings already above)

    # --- components/Dashboard/TeacherSidebar.jsx ---
    # (groups, school, assignment, library_books, settings already above)

    # --- Safety: common UI icons ---
    "help", "more_vert", "notifications", "refresh", "star",
    "visibility", "visibility_off",

    # --- pages/admin/AdminMediaCreate.jsx ---
    "cloud_upload", "content_cut", "forward_5", "headphones",
    "movie", "pause", "pause_circle", "play_arrow", "play_circle",
    "replay_5", "tune", "upload_file",

    # --- pages/common/ContentSection.jsx ---
    "schedule", "signal_cellular_alt",
]))

# ── Paths ───────────────────────────────────────────────────────────────
SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
SOURCE_FONT = os.path.join(
    SCRIPT_DIR, "node_modules", "@fontsource-variable",
    "material-symbols-outlined", "files",
    "material-symbols-outlined-latin-wght-normal.woff2",
)
OUTPUT_FONT = os.path.join(SCRIPT_DIR, "src", "fonts", "material-symbols-subset.woff2")
src_size = os.path.getsize(SOURCE_FONT)

# ── Step 1: Get icon codepoints from original font ─────────────────────
orig = TTFont(SOURCE_FONT)
orig_cmap = orig.getBestCmap()
name_to_cps = {}
for cp, name in orig_cmap.items():
    name_to_cps.setdefault(name, []).append(cp)

icon_cps = set()
for icon in ICONS:
    if icon in name_to_cps:
        for cp in name_to_cps[icon]:
            icon_cps.add(cp)

needed_cps = set(icon_cps)
for c in range(ord('a'), ord('z') + 1): needed_cps.add(c)
for c in range(ord('0'), ord('9') + 1): needed_cps.add(c)
needed_cps.add(ord('_'))
needed_cps.add(0x20)
orig.close()

print(f"Source: {src_size/1024:.0f} KB | Icons: {len(ICONS)} | Codepoints: {len(needed_cps)}")

# ── Step 2: Subset with rlig ───────────────────────────────────────────
tmp1 = os.path.join(SCRIPT_DIR, "src", "fonts", "_tmp1.woff2")
unicodes_arg = ",".join(f"U+{cp:04X}" for cp in sorted(needed_cps))
subprocess.run([
    sys.executable, "-m", "fontTools.subset", SOURCE_FONT,
    f"--output-file={tmp1}", f"--unicodes={unicodes_arg}",
    "--flavor=woff2", "--layout-features=rlig",
    "--no-hinting", "--desubroutinize",
], check=True, capture_output=True)
print(f"Pass 1 (subset+rlig): {os.path.getsize(tmp1)/1024:.1f} KB")

# ── Step 3: Prune rlig in memory ───────────────────────────────────────
font = TTFont(tmp1)
sub_cmap = font.getBestCmap()
keep_glyphs = {sub_cmap[cp] for cp in icon_cps if cp in sub_cmap}

gsub = font['GSUB'].table
kept = removed = 0
for feat in gsub.FeatureList.FeatureRecord:
    if feat.FeatureTag != 'rlig': continue
    for li in feat.Feature.LookupListIndex:
        for st in gsub.LookupList.Lookup[li].SubTable:
            actual = st.ExtSubTable if hasattr(st, 'ExtSubTable') else st
            if not hasattr(actual, 'ligatures'): continue
            new = {}
            for fg, ligs in actual.ligatures.items():
                k = [l for l in ligs if l.LigGlyph in keep_glyphs]
                kept += len(k)
                removed += len(ligs) - len(k)
                if k: new[fg] = k
            actual.ligatures = new

print(f"Pass 2 (prune rlig): kept {kept}, removed {removed}")

# Save as temporary uncompressed TTF for re-subsetting
tmp2 = os.path.join(SCRIPT_DIR, "src", "fonts", "_tmp2.ttf")
font.flavor = None  # save as raw TTF
font.save(tmp2)
font.close()
os.unlink(tmp1)

print(f"  Intermediate TTF: {os.path.getsize(tmp2)/1024:.1f} KB")

# ── Step 4: Re-subset the pruned TTF to garbage-collect unused glyphs ──
# Use --glyphs=* to keep everything that's reachable, woff2 compress
subprocess.run([
    sys.executable, "-m", "fontTools.subset", tmp2,
    f"--output-file={OUTPUT_FONT}",
    f"--unicodes={unicodes_arg}",
    "--flavor=woff2",
    "--layout-features=rlig",
    "--no-hinting", "--desubroutinize",
], check=True, capture_output=True)
os.unlink(tmp2)

out_size = os.path.getsize(OUTPUT_FONT)
print(f"\nPass 3 (re-subset + woff2): {out_size/1024:.1f} KB")
print(f"  {src_size/1024:.0f} KB -> {out_size/1024:.1f} KB  ({100-out_size/src_size*100:.1f}% smaller)")

# Verify
vf = TTFont(OUTPUT_FONT)
vc = vf.getBestCmap()
icon_count = sum(1 for cp in icon_cps if cp in vc)
has_rlig = 'GSUB' in vf and any(f.FeatureTag == 'rlig' for f in vf['GSUB'].table.FeatureList.FeatureRecord)
print(f"\nVerification: {icon_count} icon glyphs, rlig={'yes' if has_rlig else 'NO'}")
vf.close()
