# 🔧 AIBOS-UI Quick Fix Guide

**Issue**: date-fns@4.1.0 module resolution bug  
**Impact**: Prevents components from loading in Next.js  
**Severity**: Critical  
**Fix Time**: 5 minutes

---

## 🎯 The Fix

### **Step 1: Clone the Repository**

```bash
git clone https://github.com/pohlai88/aibos-ui.git
cd aibos-ui
```

### **Step 2: Update package.json**

```bash
# Open packages/ui/package.json
# Find line 140:
"date-fns": "^4.1.0",

# Change to:
"date-fns": "^3.6.0",
```

**Or use this command**:

```bash
# PowerShell
(Get-Content packages/ui/package.json) -replace '"date-fns": "\^4.1.0"', '"date-fns": "^3.6.0"' | Set-Content packages/ui/package.json
```

### **Step 3: Update Dependencies**

```bash
pnpm install
```

### **Step 4: Run Tests**

```bash
pnpm test
```

**Expected**: All 752 tests should still pass ✅

### **Step 5: Build Package**

```bash
pnpm build
```

### **Step 6: Bump Version**

```bash
# Update version in packages/ui/package.json
"version": "0.1.1",
```

### **Step 7: Publish to NPM**

```bash
cd packages/ui
npm publish
```

---

## ✅ Verification

After publishing, verify the fix:

```bash
# In your ERP project
cd C:\AI-BOS\aibos-erpBOS\apps\web

# Update to new version
pnpm remove aibos-ui
pnpm add aibos-ui@0.1.1

# Restart dev server
pnpm dev
```

Visit `http://localhost:3001/test-ui` - should work now! ✅

---

## 🔍 Why This Fix Works

### **The Problem**

```
date-fns@4.1.0 structure:
└── locale/
    └── en-US.js  (tries to import './en-US/_lib/formatDistance.js')
    └── en-US/
        └── _lib/  ❌ Missing!
```

### **The Solution**

```
date-fns@3.6.0 structure:
└── locale/
    └── en-US/
        └── index.js  ✅ Correct structure
        └── _lib/
            └── formatDistance.js  ✅ Exists!
```

---

## 📋 Alternative: Temporary Workaround

If you can't publish immediately, use this workaround in your ERP project:

### **Option 1: pnpm Overrides**

```json
// package.json (root)
{
  "pnpm": {
    "overrides": {
      "date-fns": "3.6.0"
    }
  }
}
```

Then run:

```bash
pnpm install
```

### **Option 2: Use Components Without date-fns**

Most components don't use date-fns. You can use:

- ✅ Button, Card, Input, Textarea
- ✅ DataTable (without DateRangePicker)
- ✅ Form, Select, Checkbox, Radio
- ✅ Badge, Avatar, Skeleton
- ✅ Modal, Toast, Tooltip
- ✅ Tabs, Accordion, Navigation

**Avoid until fixed**:

- ❌ DateRangePicker
- ❌ DatePicker
- ❌ Components that import date-fns

---

## 🚀 After the Fix

Once aibos-ui@0.1.1 is published:

1. ✅ Update in your project: `pnpm add aibos-ui@0.1.1`
2. ✅ Remove workarounds (if any)
3. ✅ Start building UIs!
4. ✅ Follow the runbook: `RUNBOOK-M1-TO-M33-COMPLETION.md`

---

**Total Fix Time**: 5 minutes  
**Impact**: Unblocks entire UI integration  
**Priority**: Critical 🔥
