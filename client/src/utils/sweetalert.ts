import Swal from 'sweetalert2';

/**
 * Show a confirmation dialog using SweetAlert2
 * @param title - The title of the confirmation dialog
 * @param text - The text/message to display
 * @param confirmButtonText - Text for the confirm button (default: 'Yes, delete it!')
 * @param cancelButtonText - Text for the cancel button (default: 'Cancel')
 * @returns Promise<boolean> - true if confirmed, false if cancelled
 */
export const confirmDialog = async (
    title: string = 'Are you sure?',
    text: string = 'You won\'t be able to revert this!',
    confirmButtonText: string = 'Yes, delete it!',
    cancelButtonText: string = 'Cancel'
): Promise<boolean> => {
    const result = await Swal.fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText,
        cancelButtonText,
        reverseButtons: true,
    });

    return result.isConfirmed;
};

/**
 * Show a delete confirmation dialog
 * @param itemName - Name of the item being deleted (e.g., 'menu', 'user', 'role')
 * @param additionalText - Additional warning text (optional)
 * @returns Promise<boolean> - true if confirmed, false if cancelled
 */
export const confirmDelete = async (
    itemName: string = 'this item',
    additionalText?: string
): Promise<boolean> => {
    const text = additionalText
        ? `${additionalText}\n\nThis action cannot be undone!`
        : `This action cannot be undone!`;

    return confirmDialog(
        `Delete ${itemName}?`,
        text,
        'Yes, delete it!',
        'Cancel'
    );
};

/**
 * Show a success alert
 * @param title - The title of the alert
 * @param text - The text/message to display
 */
export const successAlert = async (
    title: string = 'Success!',
    text?: string
) => {
    await Swal.fire({
        title,
        text,
        icon: 'success',
        confirmButtonColor: '#3085d6',
        timer: 2000,
        showConfirmButton: false,
    });
};

/**
 * Show an error alert
 * @param title - The title of the alert
 * @param text - The text/message to display
 */
export const errorAlert = async (
    title: string = 'Error!',
    text?: string
) => {
    await Swal.fire({
        title,
        text,
        icon: 'error',
        confirmButtonColor: '#d33',
    });
};

/**
 * Show an info alert
 * @param title - The title of the alert
 * @param text - The text/message to display
 */
export const infoAlert = async (
    title: string = 'Information',
    text?: string
) => {
    await Swal.fire({
        title,
        text,
        icon: 'info',
        confirmButtonColor: '#3085d6',
    });
};

/**
 * Show a warning alert
 * @param title - The title of the alert
 * @param text - The text/message to display
 */
export const warningAlert = async (
    title: string = 'Warning!',
    text?: string
) => {
    await Swal.fire({
        title,
        text,
        icon: 'warning',
        confirmButtonColor: '#f0ad4e',
    });
};

/**
 * Show a generic confirmation action dialog
 * @param title - The title of the confirmation dialog
 * @param text - The text/message to display
 * @param confirmButtonText - Text for the confirm button
 * @param iconType - Icon type: 'warning' | 'info' | 'success' | 'error' | 'question'
 * @returns Promise<boolean> - true if confirmed, false if cancelled
 */
export const confirmAction = async (
    title: string,
    text: string,
    confirmButtonText: string = 'Confirm',
    iconType: 'warning' | 'info' | 'success' | 'error' | 'question' = 'question'
): Promise<boolean> => {
    const iconColors: Record<string, string> = {
        warning: '#f0ad4e',
        info: '#3085d6',
        success: '#28a745',
        error: '#d33',
        question: '#3085d6',
    };

    const result = await Swal.fire({
        title,
        text,
        icon: iconType,
        showCancelButton: true,
        confirmButtonColor: iconColors[iconType] || '#3085d6',
        cancelButtonColor: '#6c757d',
        confirmButtonText,
        cancelButtonText: 'Cancel',
        reverseButtons: true,
    });

    return result.isConfirmed;
};
