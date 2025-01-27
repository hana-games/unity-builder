import CloudRunner from '../cloud-runner';
import { BuildParameters, ImageTag } from '../..';
import UnityVersioning from '../../unity-versioning';
import { Cli } from '../../cli/cli';
import CloudRunnerLogger from '../services/cloud-runner-logger';
import { v4 as uuidv4 } from 'uuid';
import CloudRunnerOptions from '../cloud-runner-options';
import setups from './cloud-runner-suite.test';
import fs from 'node:fs';
import { OptionValues } from 'commander';

async function CreateParameters(overrides: OptionValues | undefined) {
  if (overrides) {
    Cli.options = overrides;
  }

  return await BuildParameters.create();
}

describe('Cloud Runner Caching', () => {
  it('Responds', () => {});
  setups();
  if (CloudRunnerOptions.cloudRunnerDebug) {
    it('Run one build it should not use cache, run subsequent build which should use cache', async () => {
      const overrides = {
        versioning: 'None',
        projectPath: 'test-project',
        unityVersion: UnityVersioning.determineUnityVersion('test-project', UnityVersioning.read('test-project')),
        targetPlatform: 'StandaloneLinux64',
        cacheKey: `test-case-${uuidv4()}`,
        customStepFiles: `debug-cache`,
      };
      if (CloudRunnerOptions.cloudRunnerCluster === `k8s`) {
        overrides.customStepFiles += `,aws-s3-pull-cache,aws-s3-upload-cache`;
      }
      const buildParameter = await CreateParameters(overrides);
      expect(buildParameter.projectPath).toEqual(overrides.projectPath);

      const baseImage = new ImageTag(buildParameter);
      const results = await CloudRunner.run(buildParameter, baseImage.toString());
      const libraryString = 'Rebuilding Library because the asset database could not be found!';
      const cachePushFail = 'Did not push source folder to cache because it was empty Library';
      const buildSucceededString = 'Build succeeded';

      expect(results).toContain(libraryString);
      expect(results).toContain(buildSucceededString);
      expect(results).not.toContain(cachePushFail);

      CloudRunnerLogger.log(`run 1 succeeded`);

      if (CloudRunnerOptions.cloudRunnerCluster === `local-docker`) {
        const cacheFolderExists = fs.existsSync(`cloud-runner-cache/cache/${overrides.cacheKey}`);
        expect(cacheFolderExists).toBeTruthy();
      }
      const buildParameter2 = await CreateParameters(overrides);

      buildParameter2.cacheKey = buildParameter.cacheKey;
      const baseImage2 = new ImageTag(buildParameter2);
      const results2 = await CloudRunner.run(buildParameter2, baseImage2.toString());
      CloudRunnerLogger.log(`run 2 succeeded`);

      const build2ContainsCacheKey = results2.includes(buildParameter.cacheKey);
      const build2ContainsBuildSucceeded = results2.includes(buildSucceededString);
      const build2NotContainsNoLibraryMessage = !results2.includes(libraryString);
      const build2NotContainsZeroLibraryCacheFilesMessage = !results2.includes(
        'There is 0 files/dir in the cache pulled contents for Library',
      );
      const build2NotContainsZeroLFSCacheFilesMessage = !results2.includes(
        'There is 0 files/dir in the cache pulled contents for LFS',
      );

      expect(build2ContainsCacheKey).toBeTruthy();
      expect(build2ContainsBuildSucceeded).toBeTruthy();
      expect(build2NotContainsZeroLibraryCacheFilesMessage).toBeTruthy();
      expect(build2NotContainsZeroLFSCacheFilesMessage).toBeTruthy();
      expect(build2NotContainsNoLibraryMessage).toBeTruthy();
    }, 1_000_000_000);
  }
});
