export const getFriendlyErrorMessage = (error: any): string => {
    if (!error) return "An unexpected error occurred.";

    // 1. Handle string errors directly
    if (typeof error === "string") {
        return error;
    }

    // 2. Extract message from Error object or API response
    let message =
        error.response?.data?.message || // Axios response
        error.message ||
        "Something went wrong.";

    const status = error.response?.status;

    // 3. Map HTTP Status Codes to Friendly Messages
    if (status === 400) {
        if (message.toLowerCase().includes("validation")) {
            return "Some information seems incorrect. Please review and try again.";
        }
        return `Request Issue: ${message}`;
    }

    if (status === 401) {
        return "Session expired. Please log in again.";
    }

    if (status === 403) {
        return "Access Denied. You do not have permission to perform this action.";
    }

    if (status === 404) {
        return "We couldn’t find the requested information.";
    }

    if (status === 500) {
        return "Server Error. Something went wrong on our end. Please try again later.";
    }

    if (status === 502) {
        return "Connection Error. The server is temporarily unreachable. Please try again in a moment.";
    }

    if (status === 503) {
        return "Service Unavailable. The server is temporarily busy. Please try again in a few moments.";
    }

    // 4. Handle Network Errors
    if (message.toLowerCase().includes("network error") || message.toLowerCase().includes("failed to fetch")) {
        return "Network Error. Please check your internet connection and try again.";
    }

    // 4.5 Handle User Deletion Restrictions
    if (message.toLowerCase().includes("user deletion restricted") ||
        message.toLowerCase().includes("cannot be deleted") ||
        message.toLowerCase().includes("interview slots")) {
        return "This user cannot be deleted as they have created interview slots. Please reassign or remove the slots before deleting this user.";
    }

    // 5. User-Friendly Translations for Specific Technical Messages
    const technicalToFriendlyMap: Record<string, string> = {
        "operation completed": "The operation finished, but check for any warnings.",
        "constraint check failed": "This action cannot be completed because it conflicts with other data (e.g., duplicates).",
        "foreign key constraint": "This item is currently formatted or being used elsewhere and cannot be modified/deleted.",
        "unique constraint": "This item already exists. Please try a different name or value.",
    };

    const lowerMsg = message.toLowerCase();
    for (const [techKey, friendlyVal] of Object.entries(technicalToFriendlyMap)) {
        if (lowerMsg.includes(techKey)) {
            return friendlyVal;
        }
    }

    // 6. Return the original message if it's already reasonably readable, otherwise fallback
    return message;
};
