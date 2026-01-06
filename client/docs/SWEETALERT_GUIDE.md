# SweetAlert2 Integration Guide

This project uses SweetAlert2 for beautiful, customizable confirmation dialogs and alerts.

## Available Utilities

All utilities are located in `src/utils/sweetalert.ts`.

### Confirmation Dialogs

#### `confirmDialog(title, text, confirmButtonText, cancelButtonText)`
Generic confirmation dialog.

```typescript
import { confirmDialog } from '../utils/sweetalert';

const confirmed = await confirmDialog(
    'Are you sure?',
    'This action cannot be undone!',
    'Yes, proceed',
    'Cancel'
);

if (confirmed) {
    // User clicked confirm
}
```

#### `confirmDelete(itemName, additionalText)`
Specialized delete confirmation dialog.

```typescript
import { confirmDelete } from '../utils/sweetalert';

const confirmed = await confirmDelete('this user', 'All associated data will be removed.');
if (confirmed) {
    // Proceed with deletion
}
```

### Alert Dialogs

#### `successAlert(title, text)`
Show a success message (auto-closes after 2 seconds).

```typescript
import { successAlert } from '../utils/sweetalert';

await successAlert('Success!', 'User created successfully');
```

#### `errorAlert(title, text)`
Show an error message.

```typescript
import { errorAlert } from '../utils/sweetalert';

await errorAlert('Error!', 'Failed to save changes');
```

#### `infoAlert(title, text)`
Show an informational message.

```typescript
import { infoAlert } from '../utils/sweetalert';

await infoAlert('Information', 'Please complete all required fields');
```

#### `warningAlert(title, text)`
Show a warning message.

```typescript
import { warningAlert } from '../utils/sweetalert';

await warningAlert('Warning!', 'This action may take several minutes');
```

## Usage Examples

### Delete Confirmation in a Component

```typescript
import { confirmDelete } from '../utils/sweetalert';
import { useToast } from '../contexts/ToastContext';

const handleDelete = async (id: string) => {
    const confirmed = await confirmDelete('this item');
    if (!confirmed) return;
    
    try {
        await itemService.delete(id);
        toast.success('Item deleted successfully');
        // Refresh list
        await loadItems();
    } catch (err) {
        toast.error('Failed to delete item');
    }
};
```

### Custom Confirmation

```typescript
import { confirmDialog } from '../utils/sweetalert';

const handleArchive = async (id: string) => {
    const confirmed = await confirmDialog(
        'Archive this item?',
        'Archived items can be restored later.',
        'Yes, archive it',
        'Keep it active'
    );
    
    if (confirmed) {
        await itemService.archive(id);
    }
};
```

### Combining with Toast Notifications

Use SweetAlert2 for confirmations and important alerts, and use Toast notifications for success/error feedback:

```typescript
// For confirmations - use SweetAlert2
const confirmed = await confirmDelete('this record');
if (!confirmed) return;

try {
    await service.delete(id);
    // For success feedback - use Toast
    toast.success('Record deleted successfully');
} catch (err) {
    // For error feedback - use Toast
    toast.error('Failed to delete record');
}
```

## Customization

To customize the default SweetAlert2 styling or behavior, edit the utility functions in `src/utils/sweetalert.ts`.

### Example: Changing Colors

```typescript
export const confirmDelete = async (itemName: string, additionalText?: string) => {
    return confirmDialog(
        `Delete ${itemName}?`,
        additionalText || 'This action cannot be undone!',
        'Yes, delete it!',
        'Cancel'
    );
};

// In confirmDialog, modify these colors:
confirmButtonColor: '#3085d6',  // Blue
cancelButtonColor: '#d33',       // Red
```

## Best Practices

1. **Use SweetAlert2 for**:
   - Delete confirmations
   - Important decisions
   - Actions that cannot be undone
   - Multi-step confirmations

2. **Use Toast notifications for**:
   - Success messages
   - Error messages
   - Quick feedback
   - Non-blocking notifications

3. **Avoid**:
   - Using both SweetAlert2 and Toast for the same action
   - Overusing confirmations for trivial actions
   - Blocking the UI unnecessarily
