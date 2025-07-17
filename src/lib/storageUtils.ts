// Roles
export function getSystemRoles() {
  const data = localStorage.getItem("systemRoles");
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
}
export function setSystemRoles(roles) {
  localStorage.setItem("systemRoles", JSON.stringify(roles));
}

// Privileges
export function getSystemPrivileges() {
  const data = localStorage.getItem("systemPrivileges");
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
}
export function setSystemPrivileges(privileges) {
  localStorage.setItem("systemPrivileges", JSON.stringify(privileges));
}

// Users
export function getAdminUsers() {
  const data = localStorage.getItem("adminUsers");
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
}
export function setAdminUsers(users) {
  localStorage.setItem("adminUsers", JSON.stringify(users));
} 