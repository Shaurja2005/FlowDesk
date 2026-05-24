const User = require('../models/User');
const asyncHandler = require('../middlewares/asyncHandler');
const { encryptToken, decryptToken } = require('../utils/crypto');
const { successResponse, errorResponse } = require('../utils/response');

const GITHUB_API = 'https://api.github.com';
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 min

// Helper: make authenticated GitHub API call
const githubFetch = async (path, token, options = {}) => {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `GitHub API error ${res.status}`);
  }
  return res.json();
};

// Helper: get decrypted token for a user, throwing if not connected
const getDecryptedToken = async (userId) => {
  const user = await User.findById(userId).select('+github.accessToken');
  if (!user?.github?.accessToken) {
    throw Object.assign(new Error('GitHub account not connected.'), { statusCode: 403 });
  }
  return decryptToken(user.github.accessToken);
};

// ─── GET /api/integrations/github/connect ────────────────────────────────────
const connectGitHub = asyncHandler(async (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_REDIRECT_URI,
    scope: 'repo read:user read:org',
    state: req.user._id.toString(), // use userId as CSRF state
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// ─── GET /api/integrations/github/callback ───────────────────────────────────
const githubCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.redirect(`${process.env.CLIENT_URL}/settings?tab=integrations&error=missing_params`);
  }

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GITHUB_REDIRECT_URI,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return res.redirect(`${process.env.CLIENT_URL}/settings?tab=integrations&error=oauth_failed`);
  }

  // Fetch GitHub user info
  const ghUser = await githubFetch('/user', tokenData.access_token);

  // Encrypt token and store on user
  const encrypted = encryptToken(tokenData.access_token);
  await User.findByIdAndUpdate(state, {
    'github.accessToken': encrypted,
    'github.username': ghUser.login,
    'github.avatarUrl': ghUser.avatar_url,
    'github.connectedAt': new Date(),
  });

  res.redirect(`${process.env.CLIENT_URL}/settings?tab=integrations&connected=github`);
});

// ─── DELETE /api/integrations/github/disconnect ──────────────────────────────
const disconnectGitHub = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    'github.accessToken': null,
    'github.username': '',
    'github.avatarUrl': '',
    'github.connectedAt': null,
    'github.repos': [],
  });
  successResponse(res, null, 'GitHub account disconnected');
});

// ─── GET /api/integrations/github/repos ──────────────────────────────────────
const getRepos = asyncHandler(async (req, res) => {
  const token = await getDecryptedToken(req.user._id);
  const repos = await githubFetch('/user/repos?per_page=100&sort=pushed&type=all', token);

  const sanitized = repos.map((r) => ({
    id: r.id,
    fullName: r.full_name,
    name: r.name,
    owner: r.owner.login,
    private: r.private,
    description: r.description,
    defaultBranch: r.default_branch,
    pushedAt: r.pushed_at,
    htmlUrl: r.html_url,
  }));

  successResponse(res, sanitized);
});

// ─── GET /api/integrations/github/repos/:owner/:repo/commits ─────────────────
const getCommits = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  const token = await getDecryptedToken(req.user._id);
  const commits = await githubFetch(`/repos/${owner}/${repo}/commits?per_page=20`, token);

  const sanitized = commits.map((c) => {
    let msg = c.commit.message;
    const taskMatch = msg.match(/KAN-\d+/g);
    const taskKeys = taskMatch ? [...new Set(taskMatch)] : [];
    
    if (msg.length > 80) msg = msg.slice(0, 80) + '...';

    return {
      sha: c.sha,
      shortSha: c.sha.slice(0, 7),
      message: msg,
      taskKeys,
      author: {
        name: c.commit.author.name,
        date: c.commit.author.date,
        avatarUrl: c.author?.avatar_url || null,
        login: c.author?.login || null,
      },
      htmlUrl: c.html_url,
    };
  });

  successResponse(res, sanitized);
});

// ─── GET /api/integrations/github/repos/:owner/:repo/pulls ───────────────────
const getPulls = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  const token = await getDecryptedToken(req.user._id);
  // Fetch open + closed so frontend can display all states
  const [open, closed] = await Promise.all([
    githubFetch(`/repos/${owner}/${repo}/pulls?state=open&per_page=20`, token),
    githubFetch(`/repos/${owner}/${repo}/pulls?state=closed&per_page=20`, token),
  ]);

  const mapPR = (pr) => ({
    number: pr.number,
    title: pr.title,
    state: pr.merged_at ? 'merged' : pr.state,
    author: {
      login: pr.user.login,
      avatarUrl: pr.user.avatar_url,
    },
    baseBranch: pr.base.ref,
    headBranch: pr.head.ref,
    commits: pr.commits,
    changedFiles: pr.changed_files,
    createdAt: pr.created_at,
    mergedAt: pr.merged_at,
    htmlUrl: pr.html_url,
  });

  successResponse(res, { open: open.map(mapPR), closed: closed.map(mapPR) });
});

// ─── GET /api/integrations/github/repos/:owner/:repo/branches ────────────────
const getBranches = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  const token = await getDecryptedToken(req.user._id);

  // Get repo info for default branch
  const [branches, repoInfo] = await Promise.all([
    githubFetch(`/repos/${owner}/${repo}/branches?per_page=100`, token),
    githubFetch(`/repos/${owner}/${repo}`, token),
  ]);

  const sanitized = branches.map((b) => ({
    name: b.name,
    isDefault: b.name === repoInfo.default_branch,
    protected: b.protected,
    commitSha: b.commit.sha,
    commitUrl: b.commit.url,
  }));

  successResponse(res, sanitized);
});

// ─── GET /api/integrations/github/repos/:owner/:repo/tree ────────────────────
const getRepoTree = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  const { path = '', branch } = req.query;
  const token = await getDecryptedToken(req.user._id);

  const query = branch ? `?ref=${encodeURIComponent(branch)}` : '';
  const urlPath = path ? `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}${query}` : `/repos/${owner}/${repo}/contents${query}`;
  
  const contents = await githubFetch(urlPath, token);
  
  // GitHub returns an array for directories, object for files. We expect a directory here.
  if (!Array.isArray(contents)) {
    return errorResponse(res, 'Path is not a directory', 400);
  }

  const tree = contents.map(item => ({
    name: item.name,
    path: item.path,
    type: item.type, // 'file' or 'dir'
    size: item.size,
    sha: item.sha,
    downloadUrl: item.download_url
  }));

  // Sort: directories first, then alphabetically
  tree.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'dir' ? -1 : 1;
  });

  successResponse(res, tree);
});

// ─── GET /api/integrations/github/repos/:owner/:repo/file ────────────────────
const getRepoFile = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  const { path, branch } = req.query;
  const token = await getDecryptedToken(req.user._id);

  if (!path) return errorResponse(res, 'File path is required', 400);

  const query = branch ? `?ref=${encodeURIComponent(branch)}` : '';
  const contents = await githubFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}${query}`, token);

  if (Array.isArray(contents)) {
    return errorResponse(res, 'Path is a directory, not a file', 400);
  }

  // 500KB limit
  if (contents.size > 500 * 1024) {
    return res.status(413).json({ success: false, message: 'File is too large to preview (limit 500KB)' });
  }

  // Binary check
  const ext = path.split('.').pop().toLowerCase();
  const binaryExts = ['png', 'jpg', 'jpeg', 'gif', 'ico', 'woff', 'woff2', 'ttf', 'eot', 'zip', 'exe', 'pdf', 'mp4', 'webm', 'ogg', 'mp3', 'wav'];
  if (binaryExts.includes(ext)) {
    return successResponse(res, {
      isBinary: true,
      message: 'Binary file — preview not available',
      name: contents.name,
      path: contents.path,
      sha: contents.sha,
      size: contents.size,
      downloadUrl: contents.download_url
    });
  }

  // Decode content
  let decodedContent = '';
  if (contents.content && contents.encoding === 'base64') {
    decodedContent = Buffer.from(contents.content, 'base64').toString('utf8');
  }

  successResponse(res, {
    content: decodedContent,
    encoding: contents.encoding,
    size: contents.size,
    name: contents.name,
    path: contents.path,
    sha: contents.sha,
    downloadUrl: contents.download_url
  });
});

// ─── GET /api/integrations/github/repos/:owner/:repo/readme ──────────────────
const getRepoReadme = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  const token = await getDecryptedToken(req.user._id);

  try {
    const readme = await githubFetch(`/repos/${owner}/${repo}/readme`, token);
    
    let decodedContent = '';
    if (readme.content && readme.encoding === 'base64') {
      decodedContent = Buffer.from(readme.content, 'base64').toString('utf8');
    }

    successResponse(res, {
      content: decodedContent,
      name: readme.name,
      path: readme.path,
      htmlUrl: readme.html_url
    });
  } catch (err) {
    // If no readme exists, just return empty content rather than 404 error
    if (err.statusCode === 404 || err.message.includes('404')) {
      return successResponse(res, { content: null });
    }
    throw err;
  }
});

module.exports = {
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
};
