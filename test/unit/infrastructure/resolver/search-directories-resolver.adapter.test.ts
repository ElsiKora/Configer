import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { ConfigError } from '@domain/error/config.error';
import { SearchDirectoriesResolverAdapter } from '@infrastructure/resolver/resolve-search-directories.adapter';
import { describe, expect, it } from 'vitest';

const DECIMAL_RADIX: number = '0123456789'.length;
const ROOT_INDEX: number = Number.parseInt('0', DECIMAL_RADIX);

const createTemporaryDirectory = async (): Promise<string> => {
  return mkdtemp(path.join(os.tmpdir(), 'configer-search-directories-'));
};

describe('SearchDirectoriesResolverAdapter', () => {
  it('resolves none strategy to current start directory only', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const parentDirectory: string = path.join(temporaryDirectory, 'a');
    const nestedDirectory: string = path.join(temporaryDirectory, 'a', 'b');

    await mkdir(parentDirectory);
    await mkdir(nestedDirectory);

    const resolverAdapter: SearchDirectoriesResolverAdapter =
      new SearchDirectoriesResolverAdapter();
    const stopDirectory: string | undefined = undefined;

    const resolvedDirectories: Array<string> = resolverAdapter.execute(
      nestedDirectory,
      'none',
      'app',
      stopDirectory,
    );

    expect(resolvedDirectories).toEqual([path.resolve(nestedDirectory)]);
  });

  it('resolves project strategy until package manifest', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const projectDirectory: string = path.join(temporaryDirectory, 'project');
    const sourceDirectory: string = path.join(projectDirectory, 'src');
    const nestedDirectory: string = path.join(projectDirectory, 'src', 'feature');

    await mkdir(projectDirectory);
    await mkdir(sourceDirectory);
    await mkdir(nestedDirectory);
    await writeFile(path.join(projectDirectory, 'package.json'), '{"name":"project"}', 'utf8');

    const resolverAdapter: SearchDirectoriesResolverAdapter =
      new SearchDirectoriesResolverAdapter();
    const stopDirectory: string | undefined = undefined;

    const resolvedDirectories: Array<string> = resolverAdapter.execute(
      nestedDirectory,
      'project',
      'app',
      stopDirectory,
    );

    expect(resolvedDirectories[ROOT_INDEX]).toBe(path.resolve(nestedDirectory));
    expect(resolvedDirectories).toContain(path.resolve(projectDirectory));
  });

  it('resolves workspace strategy until workspace root marker', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const workspaceRootDirectory: string = path.join(temporaryDirectory, 'workspace');
    const packagesDirectory: string = path.join(workspaceRootDirectory, 'packages');
    const appDirectory: string = path.join(workspaceRootDirectory, 'packages', 'app');
    const nestedDirectory: string = path.join(appDirectory, 'src');

    await mkdir(workspaceRootDirectory);
    await mkdir(packagesDirectory);
    await mkdir(appDirectory);
    await mkdir(nestedDirectory);
    await writeFile(path.join(workspaceRootDirectory, '.git'), '', 'utf8');

    const resolverAdapter: SearchDirectoriesResolverAdapter =
      new SearchDirectoriesResolverAdapter();
    const stopDirectory: string | undefined = undefined;

    const resolvedDirectories: Array<string> = resolverAdapter.execute(
      nestedDirectory,
      'workspace',
      'app',
      stopDirectory,
    );

    expect(resolvedDirectories).toContain(path.resolve(workspaceRootDirectory));
    expect(resolvedDirectories[ROOT_INDEX]).toBe(path.resolve(nestedDirectory));
  });

  it('resolves workspace strategy using package.json workspaces marker', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const workspaceRootDirectory: string = path.join(temporaryDirectory, 'workspace');
    const appDirectory: string = path.join(workspaceRootDirectory, 'packages', 'app');
    const nestedDirectory: string = path.join(appDirectory, 'src');

    await mkdir(workspaceRootDirectory);
    await mkdir(path.join(workspaceRootDirectory, 'packages'));
    await mkdir(appDirectory);
    await mkdir(nestedDirectory);
    await writeFile(
      path.join(workspaceRootDirectory, 'package.json'),
      '{"workspaces":["packages/*"]}',
    );

    const resolverAdapter: SearchDirectoriesResolverAdapter =
      new SearchDirectoriesResolverAdapter();
    const stopDirectory: string | undefined = undefined;

    const resolvedDirectories: Array<string> = resolverAdapter.execute(
      nestedDirectory,
      'workspace',
      'app',
      stopDirectory,
    );

    expect(resolvedDirectories).toContain(path.resolve(workspaceRootDirectory));
    expect(resolvedDirectories[ROOT_INDEX]).toBe(path.resolve(nestedDirectory));
  });

  it('throws explicit error when workspace package manifest is malformed', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const workspaceRootDirectory: string = path.join(temporaryDirectory, 'workspace');
    const appDirectory: string = path.join(workspaceRootDirectory, 'packages', 'app');
    const nestedDirectory: string = path.join(appDirectory, 'src');

    await mkdir(workspaceRootDirectory);
    await mkdir(path.join(workspaceRootDirectory, 'packages'));
    await mkdir(appDirectory);
    await mkdir(nestedDirectory);
    await writeFile(path.join(workspaceRootDirectory, 'package.json'), '{"workspaces":');

    const resolverAdapter: SearchDirectoriesResolverAdapter =
      new SearchDirectoriesResolverAdapter();
    const stopDirectory: string | undefined = undefined;

    let capturedError: unknown;

    try {
      resolverAdapter.execute(nestedDirectory, 'workspace', 'app', stopDirectory);
    } catch (error) {
      capturedError = error;
    }

    expect(capturedError).toBeInstanceOf(ConfigError);
    expect((capturedError as ConfigError).CODE).toBe('CONFIG_WORKSPACE_MANIFEST_PARSE_ERROR');
  });

  it('resolves global strategy with global config directory', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const xdgDirectory: string = path.join(temporaryDirectory, 'xdg');
    const stopDirectory: string = path.join(temporaryDirectory, 'project');
    const startDirectory: string = path.join(stopDirectory, 'src');
    const previousXdgConfigHome: string | undefined = process.env.XDG_CONFIG_HOME;

    await mkdir(xdgDirectory);
    await mkdir(stopDirectory);
    await mkdir(startDirectory);

    process.env.XDG_CONFIG_HOME = xdgDirectory;

    try {
      const resolverAdapter: SearchDirectoriesResolverAdapter =
        new SearchDirectoriesResolverAdapter();

      const resolvedDirectories: Array<string> = resolverAdapter.execute(
        startDirectory,
        'global',
        'app',
        stopDirectory,
      );
      const expectedGlobalDirectory: string = path.join(xdgDirectory, 'app');

      expect(resolvedDirectories).toContain(path.resolve(startDirectory));
      expect(resolvedDirectories).toContain(path.resolve(stopDirectory));
      expect(resolvedDirectories).toContain(path.resolve(expectedGlobalDirectory));
    } finally {
      process.env.XDG_CONFIG_HOME = previousXdgConfigHome;
    }
  });

  it('resolves global strategy with default home config when XDG is not defined', async () => {
    const temporaryDirectory: string = await createTemporaryDirectory();
    const startDirectory: string = path.join(temporaryDirectory, 'project', 'src');
    const previousXdgConfigHome: string | undefined = process.env.XDG_CONFIG_HOME;

    await mkdir(path.join(temporaryDirectory, 'project'));
    await mkdir(startDirectory);

    delete process.env.XDG_CONFIG_HOME;

    try {
      const resolverAdapter: SearchDirectoriesResolverAdapter =
        new SearchDirectoriesResolverAdapter();
      const expectedGlobalDirectory: string = path.join(os.homedir(), '.config', 'app');
      const stopDirectory: string | undefined = undefined;

      const resolvedDirectories: Array<string> = resolverAdapter.execute(
        startDirectory,
        'global',
        'app',
        stopDirectory,
      );

      expect(resolvedDirectories).toContain(path.resolve(startDirectory));
      expect(resolvedDirectories).toContain(path.resolve(expectedGlobalDirectory));
    } finally {
      if (previousXdgConfigHome) {
        process.env.XDG_CONFIG_HOME = previousXdgConfigHome;
      } else {
        delete process.env.XDG_CONFIG_HOME;
      }
    }
  });
});
