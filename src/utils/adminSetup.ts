// Admin Setup Utility
// This file contains functions to set up default admin users and roles

const API_BASE_URL = "https://new-admission-dashboard.up.railway.app/api/v1";

export const setupDefaultAdmin = async (adminEmail: string) => {
  try {
    // First, create the ADMIN role if it doesn't exist
    const createRoleResponse = await fetch(
      `${API_BASE_URL}/roles/createRoles`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "ADMIN",
          description: "Administrator with full access",
          status: true,
        }),
      },
    );

    if (!createRoleResponse.ok) {
      console.log("ADMIN role might already exist or failed to create");
    }

    // Register the admin user
    const registerUserResponse = await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: adminEmail,
        // Add other required fields as per your API specification
      }),
    });

    if (!registerUserResponse.ok) {
      throw new Error(
        `Failed to register admin user: ${registerUserResponse.status}`,
      );
    }

    const result = await registerUserResponse.json();
    console.log("Admin user created successfully:", result);
    return result;
  } catch (error) {
    console.error("Error setting up default admin:", error);
    throw error;
  }
};

export const createDefaultRoles = async () => {
  const defaultRoles = [
    { name: "ADMIN", description: "Administrator with full access" },
    { name: "USER", description: "Regular user with limited access" },
    { name: "MANAGER", description: "Manager with moderate access" },
  ];

  for (const role of defaultRoles) {
    try {
      const response = await fetch(`${API_BASE_URL}/roles/createRoles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: role.name,
          description: role.description,
          status: true,
        }),
      });

      if (response.ok) {
        console.log(`Role ${role.name} created successfully`);
      } else {
        console.log(`Role ${role.name} might already exist`);
      }
    } catch (error) {
      console.error(`Error creating role ${role.name}:`, error);
    }
  }
};

// Function to initialize the admin system
export const initializeAdminSystem = async (
  adminEmail: string = "admin@example.com",
) => {
  try {
    console.log("Initializing admin system...");

    // Create default roles
    await createDefaultRoles();

    // Create admin user
    await setupDefaultAdmin(adminEmail);

    console.log("Admin system initialized successfully!");
  } catch (error) {
    console.error("Failed to initialize admin system:", error);
  }
};
