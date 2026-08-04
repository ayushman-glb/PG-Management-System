import path from 'path';
import fs from 'fs';

export interface PackageJsonInfo {
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
}

export class PathResolver {
  /**
   * Returns the root working directory of the application (process.cwd()).
   * Guaranteed to be consistent regardless of ts-node vs dist execution.
   */
  static getProjectRoot(): string {
    return process.cwd();
  }

  /**
   * Resolves a path relative to the application root directory.
   */
  static resolveFromRoot(...relativePathSegments: string[]): string {
    return path.resolve(this.getProjectRoot(), ...relativePathSegments);
  }

  /**
   * Safely reads package.json from the project root directory.
   * Returns a fallback object if file is missing or unparseable.
   */
  static getPackageInfo(): PackageJsonInfo {
    const packageJsonPath = this.resolveFromRoot('package.json');
    try {
      if (fs.existsSync(packageJsonPath)) {
        const raw = fs.readFileSync(packageJsonPath, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          name: parsed.name || 'roombae-backend',
          version: parsed.version || '1.0.0',
          description: parsed.description || 'RoomBae Enterprise PG Management System Backend',
          author: parsed.author || 'RoomBae Engineering',
          license: parsed.license || 'ISC',
        };
      }
    } catch (error: any) {
      console.warn(`⚠️ Warning: Could not parse package.json from ${packageJsonPath}: ${error.message}`);
    }

    return {
      name: 'roombae-backend',
      version: '1.0.0',
      description: 'RoomBae Enterprise PG Management System Backend',
      author: 'RoomBae Engineering',
      license: 'ISC',
    };
  }

  /**
   * Resolves and ensures existence of the temporary upload directory.
   */
  static getUploadsDir(): string {
    const uploadsPath = this.resolveFromRoot('temp_uploads');
    if (!fs.existsSync(uploadsPath)) {
      try {
        fs.mkdirSync(uploadsPath, { recursive: true });
      } catch (err: any) {
        console.error(`❌ Could not create uploads directory at ${uploadsPath}: ${err.message}`);
      }
    }
    return uploadsPath;
  }

  /**
   * Resolves and ensures existence of the logs directory.
   */
  static getLogsDir(): string {
    const logsPath = this.resolveFromRoot('logs');
    if (!fs.existsSync(logsPath)) {
      try {
        fs.mkdirSync(logsPath, { recursive: true });
      } catch (err: any) {
        console.error(`❌ Could not create logs directory at ${logsPath}: ${err.message}`);
      }
    }
    return logsPath;
  }
}

export const APP_INFO = PathResolver.getPackageInfo();
