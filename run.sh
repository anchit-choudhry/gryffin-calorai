pnpm install &&
pnpm prune &&
pnpm dedupe &&
pnpm lint:fix &&
pnpm build &&
pnpm test
