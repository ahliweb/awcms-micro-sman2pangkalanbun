# Missing-Source Resolution Pack (M9 / #30)

This pack resolves all previously missing references from `project-docs/14-wave2-asset-classification.md` with final dispositions so downstream transforms/imports are not blocked.

## Resolution Policy

- `replaced-owned`: mapped to an owned-local managed asset.
- `removed`: reference removed from migration payload (no safe source available yet).

No unresolved entries remain in this pack.

## Final Disposition Table

| Missing reference | Disposition | Replacement / action |
| --- | --- | --- |
| `/images/news/osn-2024.jpg` | replaced-owned | `/src/assets/foto-smandapbun/kegiatan-sekolah/IMG_6409.webp` |
| `/images/news/mpls-2024.jpg` | replaced-owned | `/src/assets/foto-smandapbun/kegiatan-sekolah/IMG_6406.webp` |
| `/images/news/hardiknas-2024.jpg` | replaced-owned | `/src/assets/foto-smandapbun/kegiatan-sekolah/IMG_6398.webp` |
| `/images/alumni/hasan-basri.jpg` | replaced-owned | `/public/images/staff/teachers/teacher-41.webp` |
| `/images/alumni/siti-nurhaliza.jpg` | replaced-owned | `/public/images/staff/teachers/teacher-42.webp` |
| `/images/alumni/ahmad-yani.jpg` | replaced-owned | `/public/images/staff/teachers/teacher-43.webp` |
| `/images/alumni/rini-wulandari.jpg` | replaced-owned | `/public/images/staff/teachers/teacher-44.webp` |
| `/images/alumni/budi-prasetyo.jpg` | replaced-owned | `/public/images/staff/teachers/teacher-45.webp` |
| `/images/alumni/dewi-permatasari.jpg` | replaced-owned | `/public/images/staff/teachers/teacher-46.webp` |
| `/images/staff/kepala-sekolah.jpg` | replaced-owned | `/public/images/staff/teachers/teacher-01.webp` |
| `/images/staff/wakasek-kurikulum.jpg` | replaced-owned | `/public/images/staff/teachers/teacher-02.webp` |
| `/images/staff/wakasek-kesiswaan.jpg` | replaced-owned | `/public/images/staff/teachers/teacher-04.webp` |
| `/images/staff/wakasek-sarpras.jpg` | replaced-owned | `/public/images/staff/teachers/teacher-05.webp` |
| `/images/staff/wakasek-humas.jpg` | replaced-owned | `/public/images/staff/teachers/teacher-03.webp` |
| `/images/staff/kepala-tu.jpg` | replaced-owned | `/public/images/staff/admin/admin-01.webp` |

## Output Artifact

- Machine-readable mapping: `project-docs/migration/missing-source-resolution.json`

## Downstream Impact

- #20 can validate zero unresolved references after applying this mapping.
- #21 can run import batches without missing-path hard failures.
