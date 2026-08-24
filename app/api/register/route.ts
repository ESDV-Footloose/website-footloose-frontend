import { NextResponse } from "next/server";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL?.replace(
  /\/$/,
  "",
);

if (!STRAPI_API_URL) {
  throw new Error("Missing NEXT_PUBLIC_STRAPI_API_URL environment variable");
}

/**
 * Maps the form's academic-status values to the Strapi enum labels.
 *
 * @internal
 */
const STUDY_INSTITUTION_MAP: Record<string, string> = {
  "tu-e": "Eindhoven University of Technology",
  "tu-e-phd-engd": "Eindhoven University of Technology PhD/EngD",
  "fontys-eindhoven": "Fontys University of Applied Sciences Eindhoven",
  "design-academy-eindhoven": "Design Academy Eindhoven",
  "other-student": "Other institution",
  "not-a-student": "Not a student",
};

/**
 * Handles member registration by forwarding the request to Strapi.
 *
 * @param request Incoming registration request.
 * @returns The registration result.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const studyInstitutionEnum = STUDY_INSTITUTION_MAP[body.studentStatus];

    if (!studyInstitutionEnum) {
      return NextResponse.json(
        { message: "Please select a valid academic status." },
        { status: 400 },
      );
    }

    const isStudent = body.studentStatus !== "not-a-student";

    if (isStudent && !body.studentEmail) {
      return NextResponse.json(
        { message: "Please enter your academic email address." },
        { status: 400 },
      );
    }

    const response = await fetch(`${STRAPI_API_URL}/api/auth/local/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: body.email,
        email: body.email,
        password: body.password,
        firstName: body.firstName,
        lastName: body.lastName,
        phoneNumber: body.phoneNumber,
        dateOfBirth: body.dateOfBirth,
        studyInstitutionEnum,
        studyInstitutionOther:
          body.studentStatus === "other-student"
            ? body.otherInstitution
            : undefined,
        studentEmail: isStudent ? body.studentEmail : undefined,
        graduationYear:
          body.studentStatus === "not-a-student" && body.graduationYear
            ? Number(body.graduationYear)
            : undefined,
        motivationNotStudent:
          body.studentStatus === "not-a-student" ? body.motivation : undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            data?.error?.message ??
            "Something went wrong while creating your account.",
        },
        {
          status: response.status,
        },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Registration failed:", error);

    return NextResponse.json(
      {
        message: "Something went wrong while creating your account.",
      },
      {
        status: 500,
      },
    );
  }
}
