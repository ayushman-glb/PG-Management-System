import { prisma } from "../config/prisma";
import { logger } from "../utils/logger";

export async function ensureSparseIndexes() {
  try {
    // 1. Attempt dropping legacy non-sparse indexes on User collection if present
    const collectionsToClean = [
      { coll: "User", idx: "User_residentCode_key" },
      { coll: "User", idx: "User_googleSubId_key" },
    ];

    for (const item of collectionsToClean) {
      try {
        await prisma.$runCommandRaw({
          dropIndexes: item.coll,
          index: item.idx,
        });
        logger.info(`Dropped legacy index ${item.idx} on collection ${item.coll}`);
      } catch {
        // Ignore error if index was not present
      }
    }

    // 2. Create MongoDB partial unique indexes for optional fields
    // Partial filter expression ensures uniqueness is enforced ONLY when field is a string, allowing unlimited null/missing documents
    await prisma.$runCommandRaw({
      createIndexes: "User",
      indexes: [
        {
          key: { residentCode: 1 },
          name: "User_residentCode_sparse_key",
          unique: true,
          partialFilterExpression: { residentCode: { $type: "string" } },
        },
        {
          key: { googleSubId: 1 },
          name: "User_googleSubId_sparse_key",
          unique: true,
          partialFilterExpression: { googleSubId: { $type: "string" } },
        },
      ],
    });

    logger.info("✅ MongoDB sparse unique indexes successfully created/verified.");
  } catch (error: any) {
    logger.warn("⚠️ Sparse index creation notice:", error?.message || error);
  }
}

if (require.main === module) {
  ensureSparseIndexes()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
