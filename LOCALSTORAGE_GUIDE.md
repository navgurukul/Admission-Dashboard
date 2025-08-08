# LocalStorage Data Management Guide

## Overview
This application now includes automatic localStorage functionality that saves all your data changes locally in your browser. This ensures that your data is preserved even if there are network issues or if the database is temporarily unavailable.

## How It Works

### Automatic Data Saving
- **Adding Applicants**: When you add new applicants (either individually or via CSV import), the data is automatically saved to both localStorage and the database
- **Editing Fields**: When you edit any field in the applicant table (name, mobile number, status, stage, campus, etc.), changes are saved to localStorage first, then to the database
- **Bulk Operations**: Bulk updates and deletions are also saved to localStorage
- **Status Changes**: When you change an applicant's status or stage, it's saved locally
- **Campus Assignment**: Campus changes are preserved in localStorage

### Data Persistence
- All data is stored in your browser's localStorage under the key `admission_dashboard_applicants`
- Data persists across browser sessions and page refreshes
- If the database is unavailable, your changes are still saved locally
- When the database becomes available again, data can be synchronized

## Local Data Manager

### Accessing Local Data
1. Click the "Local Data" button in the top-right corner of the applicants table
2. This opens the LocalStorage Data Manager where you can:
   - View all locally stored applicant records
   - Export your local data as a JSON file
   - Import previously exported data
   - Clear all local data if needed

### Features
- **View Records**: See the first 10 records with key information (name, mobile, stage, status, etc.)
- **Export Data**: Download all local data as a JSON file for backup
- **Import Data**: Restore data from a previously exported JSON file
- **Clear Data**: Remove all local data (use with caution)

## Benefits

### Offline Capability
- Work continues even without internet connection
- Data is preserved locally until connection is restored
- No data loss during network interruptions

### Data Safety
- Automatic backup of all changes
- Easy export/import functionality
- Protection against accidental data loss

### Performance
- Faster data access for frequently used information
- Reduced dependency on network requests
- Better user experience

## Technical Details

### Storage Structure
```javascript
// Data is stored as an array of applicant objects
[
  {
    id: "unique_id",
    name: "Applicant Name",
    mobile_no: "1234567890",
    stage: "sourcing",
    status: "Enrollment Key Generated",
    campus: "Campus Name",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    // ... other fields
  }
]
```

### Key Functions
- `getApplicants()`: Retrieve all local data
- `addApplicants()`: Add new applicants to local storage
- `updateApplicant()`: Update existing applicant data
- `deleteApplicants()`: Remove applicants from local storage
- `bulkUpdateApplicants()`: Update multiple applicants at once
- `clearAllData()`: Remove all local data

## Best Practices

### Regular Backups
- Export your local data periodically using the Local Data Manager
- Keep backup files in a safe location
- Import data if you need to restore from a backup

### Data Management
- Use the Local Data Manager to monitor your local storage usage
- Clear old data if storage space becomes an issue
- Be careful when clearing all data as it cannot be undone

### Troubleshooting
- If you experience data inconsistencies, try refreshing the page
- If local data seems corrupted, you can clear it and re-import from a backup
- Check browser console for any localStorage-related errors

## Browser Compatibility
- Works in all modern browsers that support localStorage
- Data is browser-specific (not shared across different browsers)
- Data persists until manually cleared or browser data is cleared

## Security Notes
- LocalStorage data is stored in plain text in your browser
- Data is only accessible from the same domain
- Consider the security implications of storing sensitive data locally
- Clear local data when using shared computers 