pnpm install &&
pnpm prune &&
pnpm dedupe &&
pnpm format &&
pnpm lint:fix &&
pnpm build &&
pnpm test
