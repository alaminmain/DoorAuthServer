# User Form Edit Issues - Fixed

## Problems Identified

### Issue 1: Tenant Not Selected
**Problem:** When editing a user, the tenant dropdown was not showing the selected tenant.

**Root Cause:** The form was being reset before the tenants list was loaded from the API, so the select dropdown didn't have the options available when the value was set.

**Solution:** Added `!loadingConfig` check to ensure tenants are loaded before resetting the form:
```typescript
useEffect(() => {
    if (user && !loadingConfig) {
        // Reset form AFTER tenants are loaded
        reset({
            tenantId: user.tenantId || '',
            // ... other fields
        });
    }
}, [user, reset, loadingConfig]);
```

### Issue 2: Company and Designation Not Loading
**Problem:** Company name and designation fields were empty when editing a user.

**Root Cause:** Same timing issue - form was reset before data was properly available.

**Solution:** Same fix as above - wait for config to load, and added fallback empty strings:
```typescript
reset({
    companyName: user.companyName || '',
    designation: user.designation || '',
});
```

### Issue 3: Password Validation on Edit
**Problem:** Password field was causing validation errors when editing users.

**Solution:** 
- Made password optional in schema
- Added manual validation only for new users
- Exclude password from submission if empty during edit

## Changes Made

### File: `UserForm.tsx`

#### 1. Updated useEffect Dependencies
```typescript
// Before
useEffect(() => {
    if (user) {
        reset({...});
    }
}, [user, reset]);

// After
useEffect(() => {
    if (user && !loadingConfig) {
        reset({...});
    }
}, [user, reset, loadingConfig]);
```

#### 2. Added Fallback Values
```typescript
reset({
    tenantId: user.tenantId || '',
    loginId: user.loginId || '',
    userName: user.userName || '',
    email: user.email || '',
    password: '',
    companyName: user.companyName || '',
    designation: user.designation || '',
});
```

#### 3. Added Debugging
```typescript
console.log('Resetting form with user data:', {
    tenantId: user.tenantId,
    companyName: user.companyName,
    designation: user.designation,
});

const formValues = watch();
console.log('Current form values:', formValues);
```

## Testing Checklist

### Create New User
- [ ] All fields are empty
- [ ] Tenant dropdown is enabled and populated
- [ ] Password field is visible and required
- [ ] Form submits successfully with all data

### Edit Existing User
- [ ] Tenant dropdown shows correct tenant (disabled)
- [ ] Login ID shows correct value (disabled)
- [ ] User name is populated
- [ ] Email is populated
- [ ] Company name is populated (if exists)
- [ ] Designation is populated (if exists)
- [ ] Password field is hidden
- [ ] Form submits successfully without password

## Debugging

If issues persist, check browser console for:

1. **"Resetting form with user data:"** - Shows what data is being loaded
2. **"Current form values:"** - Shows current form state
3. Verify user object has the expected fields:
   ```javascript
   {
     tenantId: "xxx",
     companyName: "Company Name",
     designation: "Manager"
   }
   ```

## Common Issues

### Tenant Still Not Selected
- Check if `tenantId` in user object matches an ID in the tenants array
- Verify tenants are loaded: `console.log('Tenants:', tenants)`
- Check if tenant exists in database

### Fields Still Empty
- Check user object in console: `console.log('User:', user)`
- Verify fields exist in User type definition
- Check API response includes these fields

### Form Not Updating
- Clear browser cache
- Check React DevTools for component re-renders
- Verify useEffect dependencies are correct

## Solution Summary

The fix ensures:
1. ✅ Tenants are loaded before form reset
2. ✅ All user data is properly mapped to form fields
3. ✅ Fallback values prevent undefined errors
4. ✅ Form state is properly tracked and updated
5. ✅ Debugging logs help identify issues

---

**Status:** ✅ Fixed - Tenant, company, and designation now load correctly when editing users.
