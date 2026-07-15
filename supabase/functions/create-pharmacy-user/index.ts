import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_ANON_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

function getErrorPayload(code: string, message: string) {
  return {
    success: false,
    error: {
      code,
      message,
    },
  };
}

async function verifyAdminJwt(accessToken: string) {
  if (!SUPABASE_URL) {
    throw new Error("Supabase URL is not configured.");
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: ANON_KEY || SERVICE_ROLE_KEY || "",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "The provided authentication token is invalid.");
  }

  const data = await response.json();
  return data;
}

async function getProfileRole(userId: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,role`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY || "",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || "Unable to verify the administrator profile.");
  }

  const rows = await response.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function checkDuplicatePharmacyValue(table: "pharmacies", column: "name" | "license_number", value: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${column}=eq.${encodeURIComponent(value)}&select=id`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY || "",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Unable to validate ${column}.`);
  }

  const rows = await response.json();
  return Array.isArray(rows) && rows.length > 0;
}

async function deleteAuthUser(userId: string) {
  if (!userId) {
    return;
  }

  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY || "",
      "Content-Type": "application/json",
    },
  });
}

async function deleteRestRow(table: string, id: string) {
  if (!id) {
    return;
  }

  await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY || "",
      "Content-Type": "application/json",
    },
  });
}

async function deleteStaffRowsForPharmacy(pharmacyId: string) {
  if (!pharmacyId) {
    return;
  }

  await fetch(`${SUPABASE_URL}/rest/v1/pharmacy_staff?pharmacy_id=eq.${encodeURIComponent(pharmacyId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY || "",
      "Content-Type": "application/json",
    },
  });
}

async function cleanupCreatedResources(userId: string, pharmacyId: string) {
  try {
    await deleteStaffRowsForPharmacy(pharmacyId);
    await deleteRestRow("pharmacies", pharmacyId);
    await deleteRestRow("profiles", userId);
    await deleteAuthUser(userId);
  } catch {
    // Intentionally ignore cleanup failures so the original error remains visible.
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return jsonResponse(getErrorPayload("config_error", "Supabase service role configuration is missing."), 500);
  }

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

    if (!accessToken) {
      return jsonResponse(getErrorPayload("missing_token", "An authenticated admin session is required."), 401);
    }

    const adminUser = await verifyAdminJwt(accessToken);
    const adminUserId = adminUser?.id;

    if (!adminUserId) {
      return jsonResponse(getErrorPayload("invalid_token", "The provided authentication token is invalid."), 401);
    }

    const profile = await getProfileRole(adminUserId);

    if (!profile || profile.role !== "admin") {
      return jsonResponse(getErrorPayload("forbidden", "Only administrators can register pharmacies."), 403);
    }

    const body = await req.json();
    const {
      name,
      license_number,
      owner_name,
      governorate,
      street,
      phone,
      email,
      password,
    } = body ?? {};

    const requiredFields = [name, license_number, owner_name, governorate, street, phone, email, password];
    if (requiredFields.some((value) => typeof value !== "string" || value.trim() === "")) {
      return jsonResponse(getErrorPayload("validation_error", "All pharmacy and user fields are required."), 400);
    }

    const normalizedName = name.trim();
    const normalizedLicense = license_number.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (normalizedPassword.length < 8) {
      return jsonResponse(getErrorPayload("validation_error", "The password must be at least 8 characters long."), 400);
    }

    const [nameExists, licenseExists] = await Promise.all([
      checkDuplicatePharmacyValue("pharmacies", "name", normalizedName),
      checkDuplicatePharmacyValue("pharmacies", "license_number", normalizedLicense),
    ]);

    if (nameExists) {
      return jsonResponse(getErrorPayload("duplicate_name", "A pharmacy with this name already exists."), 409);
    }

    if (licenseExists) {
      return jsonResponse(getErrorPayload("duplicate_license", "A pharmacy with this license number already exists."), 409);
    }

    const userMetadata = {
      role: "pharmacy_staff",
      full_name: owner_name.trim(),
      phone_number: phone.trim(),
      address: `${street.trim()}, ${governorate.trim()}`,
    };

    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({
        email: normalizedEmail,
        password: normalizedPassword,
        email_confirm: true,
        user_metadata: userMetadata,
      }),
    });

    const authData = await authResponse.json().catch(() => ({}));
    if (!authResponse.ok) {
      const message = authData?.message || authData?.error || "Failed to create the auth user.";
      const code = authData?.code === "user_already_exists" ? "duplicate_email" : "auth_error";
      return jsonResponse(getErrorPayload(code, message), authResponse.status || 400);
    }

    const userId = authData?.id;
    if (!userId) {
      return jsonResponse(getErrorPayload("auth_error", "The auth user was created but no user id was returned."), 500);
    }

    let pharmacyId = "";
    let staffId = "";

    try {
      const address = `${street.trim()}, ${governorate.trim()}`;
      const pharmacyPayload = {
        name: normalizedName,
        license_number: normalizedLicense,
        owner: owner_name.trim(),
        governorate: governorate.trim(),
        street: street.trim(),
        phone: phone.trim(),
        email: normalizedEmail,
        address,
        status: "pending",
      };

      const pharmacyResponse = await fetch(`${SUPABASE_URL}/rest/v1/pharmacies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          apikey: SERVICE_ROLE_KEY,
          Prefer: "return=representation",
        },
        body: JSON.stringify([pharmacyPayload]),
      });

      const pharmacyData = await pharmacyResponse.json().catch(() => []);
      if (!pharmacyResponse.ok || !Array.isArray(pharmacyData) || pharmacyData.length === 0) {
        throw new Error(pharmacyData?.[0]?.message || pharmacyData?.message || pharmacyData?.error || "Failed to create the pharmacy record.");
      }

      const pharmacy = pharmacyData[0];
      pharmacyId = pharmacy.id;

      const staffPayload = {
        pharmacy_id: pharmacy.id,
        user_id: userId,
        role: "staff",
        full_name: owner_name.trim(),
        phone: phone.trim(),
        email: normalizedEmail,
      };

      const staffResponse = await fetch(`${SUPABASE_URL}/rest/v1/pharmacy_staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          apikey: SERVICE_ROLE_KEY,
          Prefer: "return=representation",
        },
        body: JSON.stringify([staffPayload]),
      });

      const staffData = await staffResponse.json().catch(() => []);
      if (!staffResponse.ok || !Array.isArray(staffData) || staffData.length === 0) {
        throw new Error(staffData?.[0]?.message || staffData?.message || staffData?.error || "Failed to create the pharmacy staff record.");
      }

      staffId = staffData[0].id;

      const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          apikey: SERVICE_ROLE_KEY,
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          role: "pharmacy_staff",
          full_name: owner_name.trim(),
          phone_number: phone.trim(),
          address: `${street.trim()}, ${governorate.trim()}`,
          updated_at: new Date().toISOString(),
        }),
      });

      const profileData = await profileResponse.json().catch(() => []);
      if (!profileResponse.ok) {
        throw new Error(profileData?.[0]?.message || profileData?.message || profileData?.error || "Failed to update the profile row.");
      }

      return jsonResponse({
        success: true,
        pharmacy,
        staff: staffData[0],
        user: authData,
        profile: Array.isArray(profileData) && profileData.length > 0 ? profileData[0] : null,
      });
    } catch (error) {
      await cleanupCreatedResources(userId, pharmacyId);
      const message = error instanceof Error ? error.message : "Pharmacy provisioning failed.";
      return jsonResponse(getErrorPayload("provisioning_error", message), 500);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pharmacy provisioning failed.";
    return jsonResponse(getErrorPayload("request_error", message), 400);
  }
});
