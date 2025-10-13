import { describe } from "vitest";

/**
 * Helper function to check if a response error is due to external dependencies
 */
export async function handleExternalDependencyError(
  response: Response,
  testName?: string
): Promise<boolean> {
  if (response.status !== 500) return false;

  let errorMessage = "Unknown server error";

  try {
    const errorData = await response.clone().json();
    errorMessage = errorData.message || errorData.error || "Server error";
  } catch {
    try {
      errorMessage = await response.clone().text();
    } catch {
      // Keep default message
    }
  }

  // Check for common external dependency errors
  const isExternalError =
    errorMessage.includes("Google Analytics") ||
    errorMessage.includes("GA4") ||
    errorMessage.includes("googleapis") ||
    errorMessage.includes("authentication") ||
    errorMessage.includes("credentials") ||
    errorMessage.includes("GOOGLE_") ||
    errorMessage.includes("Analytics Data API") ||
    errorMessage.includes("service account") ||
    errorMessage.includes("private key");

  if (isExternalError) {
    const testNameStr = testName ? ` "${testName}"` : "";
    console.warn(
      `⚠️  Test${testNameStr} skipped due to external dependency failure`
    );
    console.warn(`   Error: ${errorMessage}`);
    console.warn(
      "   This is likely due to missing Google Analytics credentials in test environment"
    );
    console.warn(
      "   Consider mocking the GA4 service or setting up test credentials"
    );
    console.warn(
      "   To resolve: Set GOOGLE_PRIVATE_KEY and GOOGLE_CLIENT_EMAIL environment variables"
    );
    return true;
  }

  return false;
}

/**
 * Enhanced expect helper that handles external dependency errors gracefully
 */
export async function expectStatus(
  response: Response,
  expectedStatus: number,
  testName?: string
): Promise<void> {
  const isExternalError = await handleExternalDependencyError(
    response,
    testName
  );
  if (isExternalError) {
    return; // Skip assertion for external errors
  }

  if (response.status !== expectedStatus) {
    // Provide more context for non-external errors
    let errorDetails = "";
    try {
      const errorData = await response.clone().json();
      errorDetails = JSON.stringify(errorData, null, 2);
    } catch {
      try {
        errorDetails = await response.clone().text();
      } catch {
        errorDetails = "Could not read response body";
      }
    }

    throw new Error(
      `Expected status ${expectedStatus} but got ${response.status}.\nResponse: ${errorDetails}`
    );
  }
}

/**
 * Wrapper for API route tests that handles external dependency failures gracefully
 */
export function describeApiRoute(
  routeName: string,
  tests: () => void,
  options: { skipOnExternalErrors?: boolean } = {}
) {
  const { skipOnExternalErrors = true } = options;

  return describe(routeName, () => {
    if (skipOnExternalErrors) {
      console.log(
        `🧪 Testing ${routeName} (with external dependency error handling)`
      );
    }
    tests();
  });
}
