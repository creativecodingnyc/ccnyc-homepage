import { expect, test } from "@playwright/test";

const lineup = {
  ok: true,
  meetingDate: "2026-11-17",
  capacity: 10,
  presenters: [],
};

async function waitForHomepage(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.locator("#topbar")).toHaveClass(/on/, { timeout: 15_000 });
}

test("the loader can be skipped", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const skip = page.getByRole("button", { name: "Skip" });
  await expect(skip).toBeVisible();
  await skip.click();
  await expect(skip).toBeHidden();
  await expect(page.locator("#board")).toHaveClass(/on/);
});

test("menu navigation opens a shareable panel", async ({ page }) => {
  await waitForHomepage(page);
  await page.getByRole("button", { name: "menu" }).click();
  await page.getByRole("link", { name: "About" }).click();
  await expect(page).toHaveURL(/\?panel=about$/);
  await expect(page.locator("#shot")).toHaveClass(/about/);
  await expect(page.locator("#shotInfo")).toHaveAttribute(
    "aria-hidden",
    "false",
  );

  await page.locator("#calendarNavBtn").click();
  await expect(page).toHaveURL(/\?panel=calendar$/);
  await expect(page.locator("#shotCalendar")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await expect(page.locator("#shotCalendar tbody tr").first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Open Google Calendar/ }),
  ).toBeVisible();
});

test("demo signup loads and submits through the public endpoint", async ({
  page,
}) => {
  let submittedBody = "";
  await page.clock.install({ time: new Date("2026-11-17T18:00:00-05:00") });
  await page.route("**/script.google.com/macros/**", async (route) => {
    const request = route.request();
    if (request.method() === "POST") submittedBody = request.postData() || "";
    const response =
      request.method() === "POST"
        ? {
            ...lineup,
            presenters: [{ name: "Ada", instagram: "ada.codes" }],
          }
        : lineup;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(response),
    });
  });

  await waitForHomepage(page);
  await page.getByRole("button", { name: "menu" }).click();
  await page.getByRole("link", { name: "Demo signup" }).click();
  await expect(page.locator("#projectorSignupStatus")).toContainText(
    "0 / 10 spots",
  );

  await page.getByLabel("Your name").fill("Ada");
  await page.getByLabel("Instagram handle, optional").fill("ada.codes");
  await page.getByLabel("Demo signup password").fill("test-only-password");
  await page
    .getByLabel("Show my Instagram handle in the public lineup")
    .check();
  await page.getByLabel("CCNYC may post my demo on Instagram").check();
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page.locator("#projectorSignupStatus")).toContainText(
    "You’re signed up, Ada!",
  );
  await expect(page.locator("#projectorLineup")).toContainText("@ada.codes");
  expect(new URLSearchParams(submittedBody).get("shareInstagram")).toBe("true");
  expect(new URLSearchParams(submittedBody).get("instagramConsent")).toBe(
    "true",
  );
});

test("a p5 loading failure reveals the static homepage", async ({ page }) => {
  await page.route("**/vendor/p5.min.js", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/webgl-fallback/, {
    timeout: 15_000,
  });
  await expect(page.locator("#board")).toHaveClass(/on/);
  await expect(page.getByRole("button", { name: "menu" })).toBeVisible();
});

test("poster export invokes the browser print flow", async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => {
      document.documentElement.dataset.printCalled = "true";
    };
  });
  await page.goto("/build-a-poster");
  await page.getByText("Export", { exact: true }).click();
  await page.getByRole("button", { name: "Save as PDF" }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-print-called",
    "true",
  );
});
