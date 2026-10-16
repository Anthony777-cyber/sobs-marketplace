# S.O.B.S. Development Rules

## 1. User control

- The user controls all changes.
- Implement only what the user explicitly requests.
- Do not add features, refactor code, redesign layouts, change wording, alter routes, or modify unrelated files without permission.
- Preserve existing working functionality and established design.
- If a request is ambiguous and the ambiguity affects implementation, ask one direct question before proceeding.

## 2. Local development only

- Work in the local workspace: `C:\Users\Gebruiker\sobs-marketplace`.
- Make and test changes locally first.
- Do not edit GitHub directly.
- Do not push commits, publish releases, or deploy to Cloudflare without the user's explicit instruction.
- A request to fix, build, or test something is not permission to deploy it.
- Never use a test branch or alter branch strategy unless explicitly instructed.

## 3. Inspect before editing

- Read the relevant existing code and follow its established patterns.
- Identify the smallest set of files required for the requested change.
- Do not replace entire files when a targeted edit will work.
- Preserve unrelated user changes.
- Never discard, reset, or overwrite existing work without permission.

## 4. Build and testing

- After code changes, run the project's build:  
  `npm.cmd run build`
- The expected build process is `tsc -b && vite build`.
- Run relevant existing tests where available.
- Report actual build and test results. Never claim a test passed unless it was run successfully.
- Fix errors caused by your changes, staying within the authorised scope.
- Do not deploy as part of testing.

## 5. Completion report

After each task, state briefly:

1. What changed.
2. Which files changed.
3. Build and test results.
4. Any unresolved problems.

Do not make additional changes after completing the requested task.

## 6. S.O.B.S. project protection

- Treat the existing local project as the working source during development.
- The live Cloudflare deployment must not be changed without explicit authorisation.
- GitHub commits and pushes require explicit authorisation.
- Deployment requires explicit authorisation.
- If the user authorises a commit or deployment, perform only the authorised publishing actions.
