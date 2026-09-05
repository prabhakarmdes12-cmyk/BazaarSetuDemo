# Central Product Asset Repository

Studio pack photography for the Dhanbad quick-commerce pilot.

## Layout
    frontend/public/catalog/items/[category]/[sku-slug].jpg   # 600x600 pack shots
    frontend/public/catalog/catalog-assets.json               # generated manifest

## Spec
- 600x600 JPG, soft off-white `#F8FAFC` studio sweep with a subtle contact shadow
- Centred packaging, legible pack size, appetising freshness
- Imagery is self-hosted (no hotlinking); labels are generic, not real trademarks

## Regenerating
    cd frontend
    npm run catalog:assets   # verify assets + rebuild catalog-assets.json
    npm run catalog:gen      # the above, then regenerate src/lib/bighiCatalog.ts

`gen-catalog-assets.cjs` fails the build if any mapped asset is missing, is not a
readable JPEG, is not exactly 600x600, or names a skuId absent from the master
catalog. Unmapped files on disk are reported as orphans.

## Adding a SKU
1. Drop the 600x600 shot at `public/catalog/items/<category>/<slug>.jpg`.
2. Add `'bb-XXXXX': '<category>/<slug>.jpg'` to `SKU_ASSETS` in `gen-catalog-assets.cjs`.
3. Run `npm run catalog:gen`.

## Integration
`gen-bighi-catalog.cjs` reads the manifest and emits `BIGHI_SKU_IMAGES` plus
`bighiImageForSku()`. Resolution order per SKU is: own pack shot -> category
photo -> branded icon plate. `/vendor/products` passes `image` through
`bighiToProduct` and both `POST /api/products` paths, so any dukaan stocking a
master-catalog line inherits the studio shot network-wide.
