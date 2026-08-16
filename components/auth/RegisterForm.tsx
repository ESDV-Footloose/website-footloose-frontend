"use client";

import Link from "next/link";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FiUserPlus } from "react-icons/fi";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

import Button from "@/components/modules/Button";
import Container from "@/components/containers/Container";

/**
 * Available student status values.
 */
type StudentStatus =
  | ""
  | "tu-e"
  | "fontys-eindhoven"
  | "design-academy-eindhoven"
  | "other-student"
  | "not-a-student";

/**
 * Properties passed to the steps component.
 *
 * @internal
 */
export type StepsProps = {
  /**
   * Total number of steps.
   */
  readonly numSteps: number;

  /**
   * Current active step.
   */
  readonly currentStep: number;
};

/**
 * Properties passed to a single step indicator.
 *
 * @internal
 */
export type StepProps = {
  /**
   * Step number.
   */
  readonly num: number;

  /**
   * Whether this step has already been completed.
   */
  readonly isComplete: boolean;

  /**
   * Whether this step is currently active.
   */
  readonly isActive: boolean;
};

const numSteps = 4;

/**
 * Register form for new Strapi users.
 *
 * @param registerFormProps Properties passed to the register form component.
 * @returns The register form component.
 */
export default function RegisterForm() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");

  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [studentStatus, setStudentStatus] = useState<StudentStatus>("");
  const [otherInstitution, setOtherInstitution] = useState("");
  const [studentEmail, setStudentEmail] = useState("");

  const [graduationYear, setGraduationYear] = useState("");
  const [motivation, setMotivation] = useState("");
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStudent =
    studentStatus === "tu-e" ||
    studentStatus === "fontys-eindhoven" ||
    studentStatus === "design-academy-eindhoven" ||
    studentStatus === "other-student";

  /**
   * Validates the first step of the registration form.
   *
   * @returns Whether the first step is valid.
   */
  function validateAccountStep() {
    if (!firstName.trim()) {
      setError("Please enter your first name.");
      return false;
    }

    if (!lastName.trim()) {
      setError("Please enter your last name.");
      return false;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return false;
    }

    if (!password) {
      setError("Please enter a password.");
      return false;
    }

    if (password !== passwordRepeat) {
      setError("The passwords do not match.");
      return false;
    }

    return true;
  }

  /**
   * Validates the second step of the registration form.
   *
   * @returns Whether the second step is valid.
   */
  function validatePersonalDetailsStep() {
    if (!dateOfBirth) {
      setError("Please enter your date of birth.");
      return false;
    }

    return true;
  }

  /**
   * Validates the third step of the registration form.
   *
   * @returns Whether the third step is valid.
   */
  function validateStudentStatusStep() {
    if (!studentStatus) {
      setError("Please select which situation applies to you.");
      return false;
    }

    if (studentStatus === "other-student" && !otherInstitution.trim()) {
      setError("Please enter the institution you study at.");
      return false;
    }

    if (isStudent && !studentEmail.trim()) {
      setError("Please enter your student email address.");
      return false;
    }

    return true;
  }

  /**
   * Validates the fourth step of the registration form.
   *
   * @returns Whether the fourth step is valid.
   */
  function validateFinalStep() {
    if (!isStudent) {
      if (!graduationYear.trim()) {
        setError("Please enter your graduation year.");
        return false;
      }

      if (!motivation.trim()) {
        setError(
          "Please enter your motivation to become a member of Footloose.",
        );
        return false;
      }
    }

    if (!privacyPolicyAccepted) {
      setError("Please agree with the privacy policy.");
      return false;
    }

    return true;
  }

  /**
   * Validates all registration steps.
   *
   * @returns Whether all registration steps are valid.
   */
  function validateAllSteps() {
    if (!validateAccountStep()) {
      setCurrentStep(1);
      return false;
    }

    if (!validatePersonalDetailsStep()) {
      setCurrentStep(2);
      return false;
    }

    if (!validateStudentStatusStep()) {
      setCurrentStep(3);
      return false;
    }

    if (!validateFinalStep()) {
      setCurrentStep(4);
      return false;
    }

    return true;
  }

  /**
   * Moves to the next registration step.
   */
  function handleNextStep() {
    setError("");

    if (currentStep === 1 && !validateAccountStep()) {
      return;
    }

    if (currentStep === 2 && !validatePersonalDetailsStep()) {
      return;
    }

    if (currentStep === 3 && !validateStudentStatusStep()) {
      return;
    }

    setCurrentStep((previousStep) => Math.min(previousStep + 1, numSteps));
  }

  /**
   * Moves to the previous registration step.
   */
  function handlePreviousStep() {
    setError("");
    setCurrentStep((previousStep) => Math.max(previousStep - 1, 1));
  }

  /**
   * Creates the account after the final registration step.
   */
  async function handleCreateAccount() {
    setError("");

    if (!validateAllSteps()) {
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        dateOfBirth,
        phoneNumber: `${phoneCountryCode.trim()} ${phoneNumber.trim()}`,
        studentStatus,
        studentEmail,
        otherInstitution,
        graduationYear,
        motivation,
        privacyPolicyAccepted,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setIsSubmitting(false);
      setError(
        data.message ?? "Something went wrong while creating your account.",
      );
      return;
    }

    const loginResult = await signIn("credentials", {
      identifier: email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (loginResult?.error) {
      setError(
        "Your account was created, but logging in failed. Please try logging in manually.",
      );
      return;
    }

    router.push("/membership");
  }

  return (
    <Container innerClassName="bg-neutral-100" className="flex justify-center">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-footloose/10 text-footloose">
            <FiUserPlus size={28} />
          </div>

          <h1 className="text-3xl font-bold">Create account</h1>

          <p className="mt-2 text-sm text-neutral-600">
            Register with your email address to create your Footloose account.
          </p>
        </div>

        <Steps numSteps={numSteps} currentStep={currentStep} />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="min-h-84 rounded-2xl bg-white p-8 shadow-xl"
          >
            {currentStep === 1 && (
              <div className="grid gap-4">
                <div>
                  <h2 className="text-lg font-bold">Account details</h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    Start with your basic login details.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold">First name</span>
                    <input
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      type="text"
                      autoComplete="given-name"
                      className="rounded-md border border-black/20 bg-white px-4 py-3 outline-none transition-colors focus:border-footloose"
                      placeholder="First name"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold">Last name</span>
                    <input
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      type="text"
                      autoComplete="family-name"
                      className="rounded-md border border-black/20 bg-white px-4 py-3 outline-none transition-colors focus:border-footloose"
                      placeholder="Last name"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">Email</span>
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    autoComplete="email"
                    className="rounded-md border border-black/20 bg-white px-4 py-3 outline-none transition-colors focus:border-footloose"
                    placeholder="you@example.com"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">Password</span>
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    autoComplete="new-password"
                    className="rounded-md border border-black/20 bg-white px-4 py-3 outline-none transition-colors focus:border-footloose"
                    placeholder="••••••••"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">Repeat password</span>
                  <input
                    value={passwordRepeat}
                    onChange={(event) => setPasswordRepeat(event.target.value)}
                    type="password"
                    autoComplete="new-password"
                    className="rounded-md border border-black/20 bg-white px-4 py-3 outline-none transition-colors focus:border-footloose"
                    placeholder="••••••••"
                  />
                </label>
              </div>
            )}

            {currentStep === 2 && (
              <div className="grid gap-4">
                <div>
                  <h2 className="text-lg font-bold">Personal details</h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    We need these details for your membership registration.
                  </p>
                </div>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">Date of birth</span>
                  <input
                    value={dateOfBirth}
                    onChange={(event) => setDateOfBirth(event.target.value)}
                    type="date"
                    autoComplete="bday"
                    className="rounded-md border border-black/20 bg-white px-4 py-3 outline-none transition-colors focus:border-footloose"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-[120px_1fr]">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold">Country code</span>
                    <input
                      value={phoneCountryCode}
                      onChange={(event) =>
                        setPhoneCountryCode(event.target.value)
                      }
                      type="text"
                      autoComplete="tel-country-code"
                      className="rounded-md border border-black/20 bg-white px-4 py-3 outline-none transition-colors focus:border-footloose"
                      placeholder="+31"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold">
                      Phone number (optional)
                    </span>
                    <input
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      type="tel"
                      autoComplete="tel-national"
                      className="rounded-md border border-black/20 bg-white px-4 py-3 outline-none transition-colors focus:border-footloose"
                      placeholder="6 12345678"
                    />
                  </label>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="grid gap-4">
                <div>
                  <h2 className="text-lg font-bold">Student status</h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    Tell us which situation applies to you.
                  </p>
                </div>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">I am a...</span>
                  <select
                    value={studentStatus}
                    onChange={(event) => {
                      const value = event.target.value as StudentStatus;
                      setStudentStatus(value);

                      if (value !== "other-student") {
                        setOtherInstitution("");
                      }

                      if (value !== "not-a-student") {
                        setGraduationYear("");
                        setMotivation("");
                      } else {
                        setStudentEmail("");
                      }
                    }}
                    className="rounded-md border border-black/20 bg-white px-4 py-3 outline-none transition-colors focus:border-footloose"
                  >
                    <option value="">Select an option</option>
                    <option value="tu-e">TU/e Student</option>
                    <option value="fontys-eindhoven">
                      Fontys Eindhoven Student
                    </option>
                    <option value="design-academy-eindhoven">
                      Design Academy Eindhoven Student
                    </option>
                    <option value="other-student">Other Student</option>
                    <option value="not-a-student">Not a Student</option>
                  </select>
                </label>

                {studentStatus === "other-student" && (
                  <motion.label
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex flex-col gap-2"
                  >
                    <span className="text-sm font-semibold">
                      Which institution do you study at?
                    </span>
                    <input
                      value={otherInstitution}
                      onChange={(event) =>
                        setOtherInstitution(event.target.value)
                      }
                      type="text"
                      className="rounded-md border border-black/20 bg-white px-4 py-3 outline-none transition-colors focus:border-footloose"
                      placeholder="Your institution"
                    />
                  </motion.label>
                )}

                {isStudent && (
                  <motion.label
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex flex-col gap-2"
                  >
                    <span className="text-sm font-semibold">Student email</span>
                    <input
                      value={studentEmail}
                      onChange={(event) => setStudentEmail(event.target.value)}
                      type="email"
                      autoComplete="email"
                      className="rounded-md border border-black/20 bg-white px-4 py-3 outline-none transition-colors focus:border-footloose"
                      placeholder="you@example.com"
                    />
                  </motion.label>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="grid gap-4">
                {isStudent ? (
                  <>
                    <div>
                      <h2 className="text-lg font-bold">Ready to register</h2>
                      <p className="mt-1 text-sm text-neutral-600">
                        You are registering as a student member. No additional
                        details are needed.
                      </p>
                    </div>

                    <div className="rounded-md border border-footloose/20 bg-footloose/5 px-4 py-3 text-sm text-neutral-700">
                      <p className="font-semibold text-footloose">
                        Active membership
                      </p>
                      <p className="mt-1">
                        Would you like to help us improve Footloose? You can
                        become an{" "}
                        <a
                          href="/active"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-footloose hover:underline"
                        >
                          active member
                        </a>{" "}
                        and help us organize events, workshops and more. Active
                        membership grants you priority access to our dance
                        classes.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h2 className="text-lg font-bold">
                        Non-student application
                      </h2>
                      <p className="mt-1 text-sm text-neutral-600">
                        Since you are not currently a student, we need a little
                        extra information.
                      </p>
                    </div>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold">
                        Graduation year
                      </span>
                      <input
                        value={graduationYear}
                        onChange={(event) =>
                          setGraduationYear(event.target.value)
                        }
                        type="number"
                        inputMode="numeric"
                        className="rounded-md border border-black/20 bg-white px-4 py-3 outline-none transition-colors focus:border-footloose"
                        placeholder="2024"
                      />
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold">
                        Motivation to become a member of Footloose
                      </span>
                      <textarea
                        value={motivation}
                        onChange={(event) => setMotivation(event.target.value)}
                        className="min-h-32 rounded-md border border-black/20 bg-white px-4 py-3 outline-none transition-colors focus:border-footloose"
                        placeholder="Tell us why you would like to become a member."
                      />
                    </label>
                  </>
                )}

                <label className="flex cursor-pointer items-center gap-3 rounded-md border border-black/10 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                  <input
                    checked={privacyPolicyAccepted}
                    onChange={(event) =>
                      setPrivacyPolicyAccepted(event.target.checked)
                    }
                    type="checkbox"
                    className="h-4 w-4 accent-footloose"
                  />
                  <span>
                    I agree with{" "}
                    <a
                      href="/association-documents"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-footloose hover:underline"
                    >
                      privacy policy
                    </a>
                    .
                  </span>
                </label>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePreviousStep}
            disabled={currentStep === 1 || isSubmitting}
            className="flex cursor-pointer items-center gap-1 rounded-md text-sm text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FaArrowLeft size={12} />
            Previous
          </button>

          {currentStep < numSteps ? (
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={isSubmitting}
              className="items-center justify-center"
            >
              Next
              <FaArrowRight size={12} />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleCreateAccount}
              disabled={isSubmitting}
              className="justify-center"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          )}
        </div>

        <p className="text-center text-sm text-neutral-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-footloose hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </Container>
  );
}

/**
 * Registration progress indicator.
 *
 * @internal
 * @param stepsProps Properties passed to the steps component.
 * @returns The steps component.
 */
function Steps({ numSteps, currentStep }: StepsProps) {
  const stepArray = Array.from({ length: numSteps }, (_, index) => index + 1);

  return (
    <div className="flex items-center justify-between gap-3">
      {stepArray.map((stepNum) => {
        const isComplete = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <React.Fragment key={stepNum}>
            <Step num={stepNum} isComplete={isComplete} isActive={isActive} />

            {stepNum !== numSteps && (
              <div className="relative h-1 w-full rounded-full bg-neutral-200">
                <motion.div
                  className="absolute bottom-0 left-0 top-0 rounded-full bg-footloose"
                  animate={{ width: isComplete ? "100%" : 0 }}
                  transition={{ ease: "easeIn", duration: 0.3 }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * Single registration progress step.
 *
 * @internal
 * @param stepProps Properties passed to the step component.
 * @returns The step component.
 */
function Step({ num, isComplete, isActive }: StepProps) {
  return (
    <div className="relative">
      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors duration-300 ${
          isComplete
            ? "border-footloose bg-footloose text-white"
            : isActive
              ? "border-footloose bg-white text-footloose"
              : "border-neutral-300 bg-white text-neutral-300"
        }`}
      >
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.svg
              key="step-check"
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 16 16"
              height="1.5em"
              width="1.5em"
              xmlns="http://www.w3.org/2000/svg"
              initial={{ rotate: 180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -180, opacity: 0 }}
              transition={{ duration: 0.125 }}
            >
              <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
            </motion.svg>
          ) : (
            <motion.span
              key="step-number"
              initial={{ rotate: 180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -180, opacity: 0 }}
              transition={{ duration: 0.125 }}
            >
              {num}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {isActive && (
        <div className="absolute -inset-1.5 z-0 animate-pulse rounded-full bg-footloose/10" />
      )}
    </div>
  );
}
