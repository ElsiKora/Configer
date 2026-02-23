import type { ISearchDirectoriesResolverInterface } from '@application/interface/search-directories-resolver.interface';
import type { TSearchStrategy } from '@domain/type/search-strategy.type';

import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ConfigError } from '@domain/error';

export class SearchDirectoriesResolverAdapter implements ISearchDirectoriesResolverInterface {
  private readonly WORKSPACE_MARKERS: Array<string>;

  public constructor() {
    this.WORKSPACE_MARKERS = ['.git', 'lerna.json', 'nx.json', 'pnpm-workspace.yaml', 'turbo.json'];
  }

  public readonly execute = (
    startDirectory: string,
    strategy: TSearchStrategy,
    moduleName: string,
    stopDirectory: string | undefined,
  ): Array<string> => {
    if (strategy === 'none') {
      return [path.resolve(startDirectory)];
    }

    if (strategy === 'project') {
      return this.resolveProjectDirectories(startDirectory);
    }

    if (strategy === 'workspace') {
      return this.resolveWorkspaceDirectories(startDirectory);
    }

    return this.resolveGlobalDirectories(startDirectory, moduleName, stopDirectory);
  };

  private readonly ascendDirectories = (
    startDirectory: string,
    shouldStop: (directory: string) => boolean,
  ): Array<string> => {
    const directories: Array<string> = [];
    let currentDirectory: string = path.resolve(startDirectory);

    while (true) {
      directories.push(currentDirectory);

      if (shouldStop(currentDirectory)) {
        break;
      }

      const parentDirectory: string = path.dirname(currentDirectory);

      if (parentDirectory === currentDirectory) {
        break;
      }

      currentDirectory = parentDirectory;
    }

    return directories;
  };

  private readonly detectWorkspaceRoot = (startDirectory: string): string => {
    const candidateDirectories: Array<string> = this.ascendDirectories(startDirectory, () => false);

    for (const candidateDirectory of candidateDirectories) {
      const hasMarker: boolean = this.WORKSPACE_MARKERS.some((marker: string) => {
        const markerPath: string = path.join(candidateDirectory, marker);

        return existsSync(markerPath);
      });

      if (hasMarker || this.hasWorkspacePackageJson(candidateDirectory)) {
        return candidateDirectory;
      }
    }

    return candidateDirectories.at(-1) ?? startDirectory;
  };

  private readonly hasPackageManifest = (directory: string): boolean => {
    const packageJsonPath: string = path.join(directory, 'package.json');
    const packageYamlPath: string = path.join(directory, 'package.yaml');

    return existsSync(packageJsonPath) || existsSync(packageYamlPath);
  };

  private readonly hasWorkspacePackageJson = (directory: string): boolean => {
    const packageJsonPath: string = path.join(directory, 'package.json');

    if (!existsSync(packageJsonPath)) {
      return false;
    }

    try {
      const rawContent: string = readFileSync(packageJsonPath, 'utf8');
      const parsedContent: unknown = JSON.parse(rawContent) as unknown;

      if (!parsedContent || typeof parsedContent !== 'object') {
        return false;
      }

      const workspacesValue: unknown = (parsedContent as Record<string, unknown>).workspaces;

      return workspacesValue !== undefined;
    } catch (error: unknown) {
      throw new ConfigError(
        `Failed to parse package manifest "${packageJsonPath}" while detecting workspace root.`,
        'CONFIG_WORKSPACE_MANIFEST_PARSE_ERROR',
        error instanceof Error ? error : undefined,
        ['Fix malformed JSON in package.json.', 'Remove invalid workspace configuration values.'],
      );
    }
  };

  private readonly resolveGlobalConfigDirectory = (moduleName: string): string => {
    const xdgConfigHome: string | undefined = process.env.XDG_CONFIG_HOME;

    const baseDirectory: string =
      xdgConfigHome && xdgConfigHome.length > 0
        ? xdgConfigHome
        : path.join(os.homedir(), '.config');

    return path.join(baseDirectory, moduleName);
  };

  private readonly resolveGlobalDirectories = (
    startDirectory: string,
    moduleName: string,
    stopDirectory: string | undefined,
  ): Array<string> => {
    const resolvedStopDirectory: string = path.resolve(stopDirectory ?? os.homedir());

    const traversedDirectories: Array<string> = this.ascendDirectories(
      startDirectory,
      (directory: string) => {
        return directory === resolvedStopDirectory;
      },
    );

    const globalConfigDirectory: string = this.resolveGlobalConfigDirectory(moduleName);

    if (!traversedDirectories.includes(globalConfigDirectory)) {
      traversedDirectories.push(globalConfigDirectory);
    }

    return traversedDirectories;
  };

  private readonly resolveProjectDirectories = (startDirectory: string): Array<string> => {
    return this.ascendDirectories(startDirectory, (directory: string) => {
      return this.hasPackageManifest(directory);
    });
  };

  private readonly resolveWorkspaceDirectories = (startDirectory: string): Array<string> => {
    const workspaceRoot: string = this.detectWorkspaceRoot(startDirectory);

    return this.ascendDirectories(startDirectory, (directory: string) => {
      return directory === workspaceRoot;
    });
  };
}
