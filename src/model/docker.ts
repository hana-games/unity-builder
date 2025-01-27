import { execWithErrorCheck } from './exec-with-error-check';
import ImageEnvironmentFactory from './image-environment-factory';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { ExecOptions } from '@actions/exec';
import { DockerParameters, StringKeyValuePair } from './shared-types';

class Docker {
  static async run(
    image: string,
    parameters: DockerParameters,
    silent: boolean = false,
    overrideCommands: string = '',
    additionalVariables: StringKeyValuePair[] = [],
    // eslint-disable-next-line unicorn/no-useless-undefined
    options: ExecOptions | undefined = undefined,
    entrypointBash: boolean = false,
  ) {
    let runCommand = '';
    switch (process.platform) {
      case 'linux':
        runCommand = this.getLinuxCommand(image, parameters, overrideCommands, additionalVariables, entrypointBash);
        break;
      case 'win32':
        runCommand = this.getWindowsCommand(image, parameters);
    }
    if (options) {
      options.silent = silent;
      await execWithErrorCheck(runCommand, undefined, options);
    } else {
      await execWithErrorCheck(runCommand, undefined, { silent });
    }
  }

  static addAllocation(value: string, allocation: number): string {
    // In value it can have multiple values of /tmp/runner
    // We need to replace all of them
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace
    return value.replace(/\/tmp\/runner/g, `/tmp/runner${allocation}`);
  }

  static getLinuxCommand(
    image: string,
    parameters: DockerParameters,
    overrideCommands: string = '',
    additionalVariables: StringKeyValuePair[] = [],
    entrypointBash: boolean = false,
  ): string {
    const { workspace, actionFolder, runnerTempPath, sshAgent, gitPrivateToken, allocation } = parameters;

    const githubHome = path.join(runnerTempPath, '_github_home');
    if (!existsSync(githubHome)) mkdirSync(githubHome);
    const githubWorkflow = path.join(runnerTempPath, '_github_workflow');
    if (!existsSync(githubWorkflow)) mkdirSync(githubWorkflow);
    const commandPrefix = image === `alpine` ? `/bin/sh` : `/bin/bash`;

    const actionFolderFormat = this.addAllocation(actionFolder, allocation);
    const workspaceFormat = this.addAllocation(workspace, allocation);
    const githubWorkflowFormat = this.addAllocation(githubWorkflow, allocation);
    const githubHomeFormat = this.addAllocation(githubHome, allocation);

    const environmentVariables = Object.keys(process.env)
      .filter((key) => key.startsWith('GAME_'))
      .map((key) => `--env ${key}="${process.env[key]}"`)
      .join(' ');

    return `docker run \
            --workdir /github/workspace \
            --rm \
            ${this.addAllocation(
              ImageEnvironmentFactory.getEnvVarString(parameters, additionalVariables),
              allocation,
            )} \
            --env UNITY_SERIAL \
            --env GAME_VERSION \
            --env GITHUB_WORKSPACE=/github/workspace \
            ${environmentVariables} \
            ${gitPrivateToken ? `--env GIT_PRIVATE_TOKEN="${gitPrivateToken}"` : ''} \
            ${sshAgent ? '--env SSH_AUTH_SOCK=/ssh-agent' : ''} \
            --volume "${githubHomeFormat}":"/root:z" \
            --volume "${githubWorkflowFormat}":"/github/workflow:z" \
            --volume "${workspaceFormat}":"/github/workspace:z" \
            --volume "${actionFolderFormat}/default-build-script:/UnityBuilderAction:z" \
            --volume "${actionFolderFormat}/platforms/ubuntu/steps:/steps:z" \
            --volume "${actionFolderFormat}/platforms/ubuntu/entrypoint.sh:/entrypoint.sh:z" \
            --volume "${actionFolderFormat}/unity-config:/usr/share/unity3d/config/:z" \
            ${sshAgent ? `--volume ${sshAgent}:/ssh-agent` : ''} \
            ${sshAgent ? '--volume /home/runner/.ssh/known_hosts:/root/.ssh/known_hosts:ro' : ''} \
            ${entrypointBash ? `--entrypoint ${commandPrefix}` : ``} \
            ${image} \
            ${entrypointBash ? `-c` : `${commandPrefix} -c`} \
            "${overrideCommands !== '' ? overrideCommands : `/entrypoint.sh`}"`;
  }

  static getWindowsCommand(image: string, parameters: DockerParameters): string {
    const { workspace, actionFolder, unitySerial, gitPrivateToken } = parameters;

    return `docker run \
            --workdir c:/github/workspace \
            --rm \
            ${ImageEnvironmentFactory.getEnvVarString(parameters)} \
            --env UNITY_SERIAL="${unitySerial}" \
            --env GITHUB_WORKSPACE=c:/github/workspace \
            ${gitPrivateToken ? `--env GIT_PRIVATE_TOKEN="${gitPrivateToken}"` : ''} \
            --volume "${workspace}":"c:/github/workspace" \
            --volume "c:/regkeys":"c:/regkeys" \
            --volume "C:/Program Files (x86)/Microsoft Visual Studio":"C:/Program Files (x86)/Microsoft Visual Studio" \
            --volume "C:/Program Files (x86)/Windows Kits":"C:/Program Files (x86)/Windows Kits" \
            --volume "C:/ProgramData/Microsoft/VisualStudio":"C:/ProgramData/Microsoft/VisualStudio" \
            --volume "${actionFolder}/default-build-script":"c:/UnityBuilderAction" \
            --volume "${actionFolder}/platforms/windows":"c:/steps" \
            --volume "${actionFolder}/BlankProject":"c:/BlankProject" \
            ${image} \
            powershell c:/steps/entrypoint.ps1`;
  }
}

export default Docker;
