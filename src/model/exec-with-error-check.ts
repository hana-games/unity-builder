import { getExecOutput, ExecOptions } from '@actions/exec';
import * as core from '@actions/core';

export async function execWithErrorCheck(
  commandLine: string,
  arguments_?: string[],
  options?: ExecOptions,
): Promise<number> {
  const result = await getExecOutput(commandLine, arguments_, options);

  // Check for errors in the Build Results section
  const match = result.stdout.match(/^#\s*Build results\s*#(.*)^Size:/ms);

  if (match) {
    const buildResults = match[1];
    const errorMatch = buildResults.match(/^Errors:\s*(\d+)$/m);
    const buildPath = buildResults.match(/^FullBuildPath:\s*(.+)$/m);
    if (buildPath && buildPath[1]) {
      core.setOutput('buildPath', buildPath[1]);
    }
    if (errorMatch && Number.parseInt(errorMatch[1], 10) !== 0) {
      throw new Error(`There was an error building the project. Please read the logs for details.`);
    }
  } else {
    throw new Error(`There was an error building the project. Please read the logs for details.`);
  }

  return result.exitCode;
}
