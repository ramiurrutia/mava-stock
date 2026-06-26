const defaultAdminPassword = "877";

function getAdminPassword() {
  return process.env.MAVA_ADMIN_PASSWORD ?? defaultAdminPassword;
}

export function isAdminRequest(request: Request) {
  return request.headers.get("x-mava-admin-key") === getAdminPassword();
}

export function isValidAdminPassword(password: string) {
  return password === getAdminPassword();
}
