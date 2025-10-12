# Git Pre-Push Validation

This project includes an automated validation system that runs before every `git push` to ensure code quality and prevent deployment failures.

## What Gets Validated

The pre-push hook performs the following checks:

1. **TypeScript Compilation** (`npm run validate:types`)

   - Ensures all TypeScript code compiles without errors
   - Uses `tsc --noEmit` to check types without generating files

2. **Unit Tests** (`npm run validate:tests`)

   - Runs all unit tests using Vitest
   - Currently includes 23 tests for analytics and hooks

3. **Code Linting** (`npm run validate:lint`)

   - Checks code style and potential issues using ESLint
   - Enforces consistent coding standards

4. **Prisma Schema Validation** (`npx prisma validate`)

   - Validates the database schema for syntax errors
   - Ensures schema is properly formatted

5. **Build Process** (`npm run validate:build`)
   - Tests the complete production build process
   - Includes Prisma client generation and Next.js build
   - This is the same process that Vercel will run

## How It Works

### Automatic Validation (Git Hook)

- The validation runs automatically when you execute `git push`
- If any check fails, the push is aborted
- You'll see colored output showing which checks passed/failed

### Manual Validation

You can run the validation manually using these commands:

```bash
# Run all validations (recommended before pushing)
npm run pre-push

# Run individual validations
npm run validate:types    # TypeScript check only
npm run validate:tests    # Tests only
npm run validate:lint     # Linting only
npm run validate:build    # Build check only
npm run validate         # Types + Tests + Lint (no build)
```

## Cross-Platform Support

The system works on both Windows and Unix-based systems:

- **Windows**: Uses PowerShell script (`.git/hooks/pre-push.ps1`)
- **Linux/Mac**: Uses shell script (`.git/hooks/pre-push`)
- The main git hook automatically detects the platform and uses the appropriate script

## What To Do When Validation Fails

### TypeScript Errors

```bash
npm run validate:types
# Fix the reported TypeScript errors and try again
```

### Test Failures

```bash
npm run test:run
# Fix failing tests or update them if the behavior changed intentionally
```

### Linting Issues

```bash
npm run lint
# Most linting issues can be auto-fixed with:
npm run lint -- --fix
```

### Build Failures

```bash
npm run build
# Check the build output for specific errors
# Common issues: missing environment variables, type errors, import issues
```

### Prisma Issues

```bash
npx prisma validate
npx prisma generate
# If schema changes, you might need to create a migration:
npx prisma migrate dev
```

## Bypassing Validation (Emergency)

⚠️ **Only use this in emergencies!**

You can bypass the pre-push validation with:

```bash
git push --no-verify
```

However, this is strongly discouraged as it can lead to deployment failures.

## Benefits

- **Prevents Broken Deployments**: Catches issues before they reach Vercel
- **Maintains Code Quality**: Ensures all code meets project standards
- **Saves Time**: Avoids failed builds and debugging in production
- **Team Consistency**: Everyone follows the same quality gates
- **Early Bug Detection**: Finds issues locally before they affect others

## Configuration

The validation scripts are configured in `package.json`:

- `validate`: Runs TypeScript + Tests + Linting
- `validate:types`: TypeScript compilation check
- `validate:tests`: Unit test execution
- `validate:lint`: ESLint validation
- `validate:build`: Full build process test
- `pre-push`: Complete validation including build

The git hooks are located in:

- `.git/hooks/pre-push` (main hook, cross-platform)
- `.git/hooks/pre-push.ps1` (PowerShell version for Windows)

## Testing the System

To test the validation system without pushing:

```bash
npm run pre-push
```

This will run all the same checks that would run during a real git push.
