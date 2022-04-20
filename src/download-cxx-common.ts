import * as core from '@actions/core'
import * as os from 'os'
import {resolve} from 'path'

// resolve tilde expansions, path.replace only replaces the first occurrence of a pattern
function resolve_path(path: string): string {
    if (path.startsWith(`~`)) {
        return resolve(path.replace('~', os.homedir()))
    } else {
        return resolve(path)
    }
}

async function run(): Promise<void> {
    const llvm = core.getInput('llvm', {required: true})
    const version = core.getInput('version', {required: true})

    const destination = resolve_path(core.getInput('path'))
    core.debug(`Resolved path is ${destination}`)

    core.info(`Downloading cxx-common:${version} with llvm-${llvm}`)
}

// Our main method: call the run() function and report any errors
run().catch(error => core.setFailed('Workflow failed! ' + error.message))
