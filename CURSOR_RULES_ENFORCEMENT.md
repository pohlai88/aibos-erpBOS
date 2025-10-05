# Cursor Rules Enforcement Guide

## How Cursor Rules Work

### 1. **Automatic Enforcement**
- **Always-Apply Rules**: Automatically included in every AI interaction
- **Auto-Attached Rules**: Applied when specific file patterns are referenced
- **Agent-Requested Rules**: AI can invoke when relevant
- **Manual Rules**: Only applied when explicitly mentioned

### 2. **Rule Types Implemented**

#### Always-Apply Rules (`.cursor/rules/*.mdc`)
- `file-management.mdc` - Mandatory file cleanup standards
- `code-quality.mdc` - Architecture and quality enforcement
- `powershell-compatibility.mdc` - Windows PowerShell compatibility

#### Auto-Attached Rules
- `ui-standards.mdc` - Applied to UI files (`.tsx`, `.ts`, `.jsx`, `.js`, `.css`, `.scss`)
- `version-management.mdc` - Applied to config files (`.json`, `.js`, `.cjs`, `.ts`, `.yml`, `.yaml`)

### 3. **Additional Enforcement Mechanisms**

#### Pre-commit Hook (`.git/hooks/pre-commit`)
- Checks for legacy files before commits
- Validates duplicate config files
- PowerShell-compatible for Windows

#### Package.json Scripts
```json
{
  "scripts": {
    "verify": "pnpm -w contracts:check && pnpm -w client:gen && pnpm -w depcruise",
    "depcruise": "depcruise --config .dependency-cruiser.cjs . || exit 1"
  }
}
```

### 4. **Manual Enforcement Commands**

#### Check for Legacy Files
```powershell
Get-ChildItem -Recurse -Include "*.old", "*.backup", "*.bak", "*~" | Where-Object { $_.FullName -notlike "*node_modules*" }
```

#### Validate Architecture
```powershell
pnpm run depcruise
```

#### Run Full Verification
```powershell
pnpm run verify
```

### 5. **Team Integration**

#### Version Control
- `.cursor/rules/` directory is tracked in git
- All team members get the same rules
- Rules are enforced consistently across the team

#### IDE Integration
- Cursor automatically loads rules from `.cursor/rules/`
- Rules are applied contextually based on file types
- No additional configuration needed

### 6. **Rule Violation Handling**

#### Immediate Actions
1. **Stop** - Don't proceed with violating actions
2. **Clean** - Remove legacy files immediately
3. **Verify** - Run linting and type checks
4. **Ask** - Request clarification when unclear

#### Escalation
- If rules conflict with requirements, discuss with team
- Update rules if patterns change
- Document exceptions with clear reasoning

## Benefits of This System

✅ **Automatic Enforcement** - Rules apply without manual intervention
✅ **Context-Aware** - Different rules for different file types
✅ **Team Consistency** - Same rules for all developers
✅ **Version Controlled** - Rules evolve with the project
✅ **PowerShell Compatible** - Works on Windows development environment
✅ **Pre-commit Validation** - Catches issues before they reach the repository
