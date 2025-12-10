# CSV Import Guide for Applicants

## Overview
This guide explains how to import multiple applicants into the Admission Dashboard using a CSV file.

## Getting Started

1. **Download Sample Template**: Click the "Download Sample CSV" button in the import modal to get a pre-formatted template
2. **Fill in Your Data**: Add your applicant data following the column format
3. **Upload**: Select your completed CSV file and click "Import"

## CSV Column Reference

### Required Fields
These fields must be present in your CSV file:

| Column Name | Description | Example |
|------------|-------------|---------|
| `First Name` | Applicant's first name | John |
| `Phone Number` | Primary contact number (10 digits) | 9876543210 |

### Personal Information (Optional)

| Column Name | Description | Example |
|------------|-------------|---------|
| `Middle Name` | Applicant's middle name | Kumar |
| `Last Name` | Applicant's last name | Sharma |
| `WhatsApp Number` | WhatsApp contact number | 9876543210 |
| `Email` | Email address | john.sharma@example.com |
| `Gender` | Gender (male/female/other) | male |

### Location Information (Optional)

| Column Name | Description | Example |
|------------|-------------|---------|
| `State` | State code (e.g., S-06 for Delhi) | S-06 |
| `District` | District code (e.g., D-06-01) | D-06-01 |
| `Block` | Block ID | 1 |
| `Pincode` | 6-digit postal code | 110001 |

### Education & Background (Optional)

| Column Name | Description | Example |
|------------|-------------|---------|
| `Cast ID` | Caste category ID | 1 |
| `Qualification ID` | Educational qualification ID | 1 |
| `Current Work ID` | Current employment status ID | 1 |

### Screening Round (Optional)

| Column Name | Description | Example |
|------------|-------------|---------|
| `Screening Status` | Test result status | Screening Test Pass |
| `Question Set ID` | Question set/paper ID | 1 |
| `Obtained Marks` | Marks scored in screening | 18 |
| `School ID` | Qualifying school ID | 1 |
| `Exam Centre` | Test center location | Delhi Centre |
| `Date of Test` | Test date (YYYY-MM-DD) | 2025-01-15 |

**Valid Screening Status Values:**
- `Screening Test Pass`
- `Screening Test Fail`
- `Created Student Without Exam`

### Learning Round (Optional)

| Column Name | Description | Example |
|------------|-------------|---------|
| `Learning Round Status` | Interview result | Learner Round Pass |
| `LR Comments` | Comments/feedback | Good communication skills |

**Valid Learning Round Status Values:**
- `Learner Round Pass`
- `Learner Round Fail`
- `Reschedule`
- `No Show`

### Cultural Fit Round (Optional)

| Column Name | Description | Example |
|------------|-------------|---------|
| `Cultural Fit Status` | Interview result | Cultural Fit Interview Pass |
| `CFR Comments` | Comments/feedback | Positive attitude |

**Valid Cultural Fit Status Values:**
- `Cultural Fit Interview Pass`
- `Cultural Fit Interview Fail`
- `Reschedule`
- `No Show`

### Final Decision (Optional)

| Column Name | Description | Example |
|------------|-------------|---------|
| `Campus ID` | Assigned campus ID | 1 |
| `Offer Letter Status` | Offer status | Offer Sent |
| `Onboarded Status` | Onboarding status | Onboarded |
| `Joining Date` | Joining date (YYYY-MM-DD) | 2025-02-01 |
| `Final Notes` | Additional notes | Excellent candidate |

**Valid Offer Letter Status Values:**
- `Offer Pending`
- `Offer Sent`
- `Offer Accepted`
- `Offer Declined`
- `Waitlisted`
- `Selected but not joined`

**Valid Onboarded Status Values:**
- `Onboarded`

## Column Name Flexibility

The import system supports multiple column name formats. You can use any of these variations:

### Example Variations:
- `First Name` or `first_name`
- `Phone Number` or `phone_number` or `Mobile No.`
- `WhatsApp Number` or `whatsapp_number` or `WA NO.`
- `Cast ID` or `cast_id` or `Caste`

Column names are **case-insensitive**, so `First Name`, `first name`, and `FIRST NAME` will all work.

## Important Notes

### ID Fields vs Names
For dropdown fields (Cast, Qualification, Current Work, Campus, School, Question Set), you can provide:
- **ID** (recommended): `1`, `2`, `3`, etc.
- **Name**: The system will try to match the name to find the ID

### Date Format
All dates must be in **YYYY-MM-DD** format:
- ✅ Correct: `2025-01-15`
- ❌ Incorrect: `15/01/2025`, `Jan 15, 2025`

### Phone Numbers
- Must be 10 digits
- No special characters or spaces
- Example: `9876543210`

### Marks/Scores
Can be entered as:
- **Whole number**: `18`
- **Fraction**: `18/25` (will be calculated automatically)
- **Decimal**: `0.72`

### Empty/Null Values
- Leave cells blank for optional fields
- Do not use text like "NULL", "N/A", or "-"

## Common Errors & Solutions

### Error: "Please select a valid CSV file"
- **Cause**: File is not in CSV format
- **Solution**: Save your file as CSV (Comma Separated Values) from Excel/Sheets

### Error: "Something went wrong while uploading"
- **Cause**: Invalid data format or missing required fields
- **Solution**: 
  - Ensure `First Name` and `Phone Number` are present
  - Check that phone numbers are 10 digits
  - Verify date formats are YYYY-MM-DD
  - Make sure status values match the valid options listed above

### Data Not Importing Correctly
- **Cause**: Column names don't match expected format
- **Solution**: Use exact column names from the sample template or refer to the variations listed above

## Sample CSV Structure

```csv
First Name,Middle Name,Last Name,Phone Number,WhatsApp Number,Email,Gender,State,District,Block,Pincode,Cast ID,Qualification ID,Current Work ID,Screening Status,Question Set ID,Obtained Marks,School ID,Exam Centre,Date of Test,Learning Round Status,LR Comments,Cultural Fit Status,CFR Comments,Campus ID,Offer Letter Status,Onboarded Status,Joining Date,Final Notes
John,Kumar,Sharma,9876543210,9876543210,john.sharma@example.com,male,S-06,D-06-01,1,110001,1,1,1,Screening Test Pass,1,18,1,Delhi Centre,2025-01-15,Learner Round Pass,Good communication skills,Cultural Fit Interview Pass,Positive attitude,1,Offer Sent,Onboarded,2025-02-01,Excellent candidate
```

## Best Practices

1. **Start Small**: Test with 1-2 rows first before importing large batches
2. **Use the Template**: Always start with the downloaded sample CSV template
3. **Validate Data**: Double-check phone numbers, dates, and status values before importing
4. **Keep Backups**: Save a copy of your CSV file before uploading
5. **Consistent Formatting**: Use the same format for all dates and numbers
6. **Check IDs**: Verify that IDs (Campus, School, Cast, etc.) exist in the system before importing

## Support

For issues or questions about CSV import:
1. Check this guide for common errors
2. Verify your CSV matches the sample template format
3. Ensure all required fields are present
4. Contact your system administrator for help with ID lookups

---

**Last Updated**: December 2025
