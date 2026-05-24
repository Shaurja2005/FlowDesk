const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { githubOAuthLimiter } = require('../middlewares/rateLimiter');
const {
  connectGitHub,
  githubCallback,
  disconnectGitHub,
  getRepos,
  getCommits,
  getPulls,
  getBranches,
  getRepoTree,
  getRepoFile,
  getRepoReadme,
} = require('../controllers/githubController');

// OAuth flow — /connect needs auth JWT to know which user is connecting
// /callback is hit by GitHub redirect, state param carries userId
router.get('/connect', githubOAuthLimiter, protect, connectGitHub);
router.get('/callback', githubOAuthLimiter, githubCallback); // no protect — GitHub redirects here
router.delete('/disconnect', protect, disconnectGitHub);

// GitHub API proxy
router.get('/repos', protect, getRepos);
router.get('/repos/:owner/:repo/commits', protect, getCommits);
router.get('/repos/:owner/:repo/pulls', protect, getPulls);
router.get('/repos/:owner/:repo/branches', protect, getBranches);
router.get('/repos/:owner/:repo/tree', protect, getRepoTree);
router.get('/repos/:owner/:repo/file', protect, getRepoFile);
router.get('/repos/:owner/:repo/readme', protect, getRepoReadme);

module.exports = router;
