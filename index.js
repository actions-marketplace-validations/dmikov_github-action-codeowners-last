const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');

const req = {required: true}
const DIRECTORY_TO_TRACK = core.getInput('directory_to_track', req);
const NUMBER_OF_CODE_OWNERS = core.getInput('number_of_code_owners', req);
const FILE_PATH = path.join(DIRECTORY_TO_TRACK, 'CODEOWNERS');


// const fileStream = fs.createReadStream(FILE_PATH);

try {
  const client = github.getOctokit(core.getInput('token', req))
  const context = github.context;

  const payload = JSON.stringify(github.context.payload, undefined, 2)
  core.debug(`The event payload: ${payload}`);

  const eventName = context.eventName;

  let base;
  let head;

  switch (eventName) {
    case 'pull_request':
      base = context.payload.pull_request?.base?.sha;
      head = context.payload.pull_request?.head?.sha;
      break;
    case 'push':
      base = context.payload.before;
      head = context.payload.after;
      break;
    default:
      core.setFailed(`This action supports pull requests and pushes, not ${context.eventName}.`);
  }

  if (!base || !head) {
    core.setFailed(`The base or head commits are missing in ${context.eventName} event.`);
  }

  core.debug(`Base: ${base}`);
  core.debug(`Head: ${head}`);

  client.repos.compareCommits({base, head, owner: context.repo.owner, repo: context.repo.repo}, function(err, response) {
    if(err){
      core.setFailed(err.message);
    }
    if(response){

      if (response.status !== 200) {
        core.setFailed(`The Octokit client returned ${response.status}.`);
      }

      const files = response.data.files;
      for(const file in files) {
        console.log(file);
      }

    }
  });
} catch (error) {
  core.setFailed(error.message);
}