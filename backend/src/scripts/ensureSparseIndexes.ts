import { prisma } from "../config/prisma";
import { logger } from "../utils/logger";

export async function ensureSparseIndexes() {
  try {
    // MongoDB createIndexes is idempotent: if index exists with matching name & options, it succeeds instantly without error.
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
