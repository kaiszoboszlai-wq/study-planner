# First-visit introduction screenshots

Captured from the real StudyPlanner UI at a 390 × 844 CSS-pixel mobile viewport, with a device scale factor of 2 and the Asia/Tokyo timezone. These are example plans, study records and fictional ranking names, not real user data. Capture does not contact Firestore or modify a real account.

Regenerate from the source checkout with `node scripts/capture-onboarding.cjs` (Playwright and Chromium required). The six JPEGs are direct browser captures; no interface elements or book artwork are painted into them after capture.

Book artwork uses the existing unmodified openBD images in `assets/book-covers`:

- 9784863921368 — でる順英単語スピードマスター必修2000
- 9784860647681 — ガチトレ1000問解いて学ぶ中学・高校6年分の英文法大特訓
- 9784757444270 — 1カ月で攻略!PLUS模試大学入学共通テスト英語リーディング
- 9784341132934 — 早稲田慶応への日本史探究

The source images and provider metadata remain in the existing cover catalog. The introduction displays an openBD attribution and clearly labels all screens as examples.
