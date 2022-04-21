import * as core from '@actions/core'
import * as github from '@actions/github'

import * as os from 'os'
import * as path from 'path'

import * as fs from 'fs'
import {exec} from 'child_process'
import {https} from 'follow-redirects'

interface GetReleaseOptions {
    readonly owner: string
    readonly repo: string
    readonly version: string
}

const getRelease = (
    octokit: ReturnType<typeof github.getOctokit>,
    {owner, repo, version}: GetReleaseOptions
) => {
    if (version === 'latest') {
        return octokit.rest.repos.getLatestRelease({owner, repo})
    } else {
        return octokit.rest.repos.getReleaseByTag({owner, repo, tag: version})
    }
}

async function download(destination: string, url: string): Promise<void> {
    const file = fs.createWriteStream(destination)
    core.debug(`Downloading: ${url}`)

    const req = await https.get(url, response => {
        if (response.statusCode !== 200) {
            core.error('Download error: ' + response.statusCode)
        }

        response.pipe(file)
    })

    return new Promise<void>(function(resolve, reject){
        file.on('finish', () => {
            core.debug(`Download of ${destination} was successfull`)
            file.close()
            resolve()
        })

        req.on('error', err => {
            fs.unlink(destination, () => core.error(err.message))
            reject(err.message)
        })
    });
}

async function getAssetInfo(name: string, options: GetReleaseOptions) {
    const token = core.getInput('token', {required: false})

    const octokit = github.getOctokit(token)
    const release = await getRelease(octokit, options)

    return release.data.assets.find(asset => asset.name === name)
}

async function run(): Promise<void> {
    // get action inputs
    const llvm = core.getInput('llvm')
    const version = core.getInput('version')
    const arch = core.getInput('arch')
    const image = core.getInput('image')
    const image_tag = core.getInput('image_tag')

    const name = `vcpkg_${image}-${image_tag}_llvm-${llvm}_${arch}`
    const tar_name = `${name}.tar.xz`

    // get url to requested release asset
    const owner = 'lifting-bits'
    const repo = 'cxx-common'
    const asset = await getAssetInfo(tar_name, {owner, repo, version})

    // setup destionation path
    const destination = core.getInput('destination')
    core.debug(`Resolved path is ${destination}`)

    // download the release asset
    const download_dir = fs.mkdtempSync(path.join(os.tmpdir(), `download-cxx-common`));
    const tarball = `${download_dir}/${tar_name}`

    await download(tarball, asset!.browser_download_url)
    core.debug(`Downloaded file ${tarball}`)

    if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, { recursive: true })
    }

    exec(`tar xf ${tarball} -C ${destination}`, (error, stdout, stderr) => {
        core.info(stdout)
        if (error !== null) {
            core.error(stderr)
            core.setFailed(`exec error: ${error}`)
        }
    })

    // clean up
    fs.rmSync(download_dir, { recursive: true, force: true });

    // setup output
    core.setOutput('path', `${destination}/${name}`)
}

// Our main method: call the run() function and report any errors
run().catch(error => core.setFailed('Workflow failed! ' + error.message))
