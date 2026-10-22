// ROOMTOUR demo: a public GitHub repository page, seen by a visitor who is not signed in.
// Captured 2026-10-22 from https://github.com/anthropics/claude-code at 1280 px, 1:1.
Roomtour.define(({ ui, chip, note }) => ({
  public: true, // a public page captured signed out, so its screenshot may live in git
  lang: 'en',
  title: 'A GitHub repository page',
  subtitle: 'ROOMTOUR demo',
  foot: 'Captured on 22 October 2026 from github.com/anthropics/claude-code, signed out, 1280 px wide. Contributor photos are blurred.',

  // Categories are chosen per task. Here: what a signed-out visitor can do.
  categories: {
    look:    { label: 'Safe to look',       note: 'opens or shows something, changes nothing',   tone: 'green', icon: 'eye',   line: 'solid' },
    account: { label: 'Needs an account',   note: 'asks you to sign in first',                    tone: 'blue',  icon: 'lock',  line: 'dotted' },
    public:  { label: 'Others will see it', note: 'leaves a public trace under your name',        tone: 'amber', icon: 'users', line: 'dashed' }
  },

  scenes: {
    repo: { src: 'shots/repo.png', w: 1280, h: 1300, alt: 'The front page of a public GitHub repository',
            redact: [[972, 830, 248, 124]] }
  },

  chapters: [
    { id: 'intro', name: 'Start' },
    { id: 'top',   name: 'Top of the page' },
    { id: 'files', name: 'The files' },
    { id: 'side',  name: 'Sidebar' },
    { id: 'end',   name: 'Cheat sheet' }
  ],

  steps: [
    { ch: 'intro', scene: 'repo', r: null, t: 'A repository is a project folder with a memory',
      b: `<p>Think of a shared folder that remembers every change anyone ever made. That is a repository, or repo.</p>
          <p>This page is the repo's front door. We will walk through it one zone at a time.</p>
          <p>Each zone has a colour that says what a click does:</p>
          <ul class="key">
            <li>${chip('look')}<span>opens or shows something, changes nothing</span></li>
            <li>${chip('account')}<span>asks you to sign in before it does anything</span></li>
            <li>${chip('public')}<span>leaves a public trace under your name</span></li>
          </ul>
          <p>Use the buttons below or the arrow keys.</p>` },

    { ch: 'top', scene: 'repo', r: [0, 0, 1280, 72], k: 'look', t: "GitHub's own bar",
      b: `<p>This black bar is the same on every GitHub page. The menus are about GitHub itself, not about this project.</p>` },
    { ch: 'top', scene: 'repo', r: [1051, 20, 157, 32], k: 'account', t: 'Sign in and Sign up',
      b: `<p>${ui('Sign in')} opens your account, ${ui('Sign up')} creates one. Without an account you can read everything here, but not act.</p>` },
    { ch: 'top', scene: 'repo', r: [22, 92, 190, 24], k: 'look', mb: 't', t: 'Who owns the project',
      b: `<p>${ui('anthropics')} is the owner: a company or a person. ${ui('claude-code')} is the project's name.</p>
          <p>Together they make the address: github.com/anthropics/claude-code.</p>` },
    { ch: 'top', scene: 'repo', r: [0, 124, 1280, 48], k: 'look', t: 'Sections of the project',
      b: `<ul class="plain">
            <li>${ui('Code')} — the files. We are here.</li>
            <li>${ui('Issues')} — bug reports and ideas, here more than 5,000.</li>
            <li>${ui('Pull requests')} — proposed changes waiting for review.</li>
            <li>${ui('Actions')} — robots that check every change.</li>
          </ul>
          <p>The number next to a section says how many items are open.</p>` },
    { ch: 'top', scene: 'repo', r: [32, 190, 210, 32], k: 'look', t: 'Name and Public',
      b: `<p>${ui('Public')} means anyone on the internet can see this project. A private project would show ${ui('Private')} and a lock.</p>` },
    { ch: 'top', scene: 'repo', r: [896, 192, 353, 28], k: 'public', mb: 't', t: 'Notifications, Fork, Star',
      b: `<ul class="plain">
            <li>${ui('Notifications')} — get e-mails about this project.</li>
            <li>${ui('Fork')} — make your own copy to experiment with.</li>
            <li>${ui('Star')} — a public bookmark. The number shows how many people starred it.</li>
          </ul>
          <p>All three need an account. A star and a fork show up on your public profile.</p>` },

    { ch: 'files', scene: 'repo', r: [32, 265, 106, 32], k: 'look', mb: 'l', t: 'Branch: main',
      b: `<p>A branch is a parallel version of the project, like a copy of a design file to try an idea.</p>
          <p>${ui('main')} is the main version. The menu switches to another branch, only for viewing.</p>` },
    { ch: 'files', scene: 'repo', r: [146, 265, 219, 32], k: 'look', t: 'Branches and Tags',
      b: `<p>${ui('216 Branches')} — how many parallel versions exist. ${ui('255 Tags')} — named moments, usually releases like 1.0 or 2.0.</p>` },
    { ch: 'files', scene: 'repo', r: [615, 265, 203, 32], k: 'look', t: 'Go to file',
      b: `<p>Search for a file by its name. Faster than clicking through folders.</p>` },
    { ch: 'files', scene: 'repo', r: [827, 265, 109, 32], k: 'look', mb: 't', t: 'The green Code button',
      b: `<p>Despite its colour, it changes nothing. It shows how to download the project: as a link for developers or as a zip file.</p>` },
    { ch: 'files', scene: 'repo', r: [33, 314, 903, 53], k: 'look', t: 'The latest save',
      b: `<p>Each save of the project is a commit. This row shows the latest one: who saved, what they wrote about it and when.</p>
          <p>${ui('939 Commits')} on the right opens the full history of saves.</p>` },
    { ch: 'files', scene: 'repo', r: [32, 367, 904, 779], k: 'look', t: 'Folders and files',
      b: `<p>Left: the folders and files. Middle: the note from the last save that touched each one. Right: how long ago.</p>
          <p>A click opens a folder or a file to read.</p>` },
    { ch: 'files', scene: 'repo', r: [33, 1163, 903, 48], k: 'look', t: 'README, License, Security',
      b: `<p>${ui('README')} is the project's front-page text: what it is and how to start. ${ui('License')} says what you may do with the code. ${ui('Security')} says how to report a vulnerability.</p>` },

    { ch: 'side', scene: 'repo', r: [976, 265, 272, 240], k: 'look', t: 'About',
      b: `<p>One paragraph on what the project does, and a link to its documentation.</p>` },
    { ch: 'side', scene: 'repo', r: [976, 660, 130, 80], k: 'look', mb: 'r', t: 'Stars, watching, forks',
      b: `<p>Three popularity counters: how many people starred, follow and copied the project.</p>
          ${note('Good to know.', 'Big numbers mean many people use it, not that every line is perfect.')}` },
    { ch: 'side', scene: 'repo', r: [976, 783, 272, 214], k: 'look', mb: 'r', t: 'Contributors',
      b: `<p>People who changed the project. In this demo their photos are blurred: a tour shows the interface, not people.</p>` },
    { ch: 'side', scene: 'repo', r: [976, 997, 272, 127], k: 'look', mb: 'r', t: 'Languages',
      b: `<p>Which programming languages the code is written in, by share. Here mostly TypeScript and Python.</p>` },

    { ch: 'end', scene: 'repo', r: null, map: true, t: 'Cheat sheet',
      b: `<h3>${chip('look')}</h3>
          <p>Almost the whole page: sections, branches, the file list, README, the sidebar, even the green Code button.</p>
          <h3>${chip('account')}</h3>
          <p>${ui('Sign in')}, ${ui('Sign up')}, and everything that acts: watch, fork, star, report.</p>
          <h3>${chip('public')}</h3>
          <p>${ui('Star')} and ${ui('Fork')}: both show up on your public profile.</p>
          <p>The numbers on the screenshot lead to the tour's steps.</p>` }
  ]
}));
