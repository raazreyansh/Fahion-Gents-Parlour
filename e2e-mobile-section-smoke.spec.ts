import { test, expect } from "@playwright/test";

test("mobile app sections are clickable", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 917 });
  await page.goto("/", { waitUntil: "networkidle" });

  await expect(page.getByText("Quick. Clean.")).toBeVisible();
  await expect(page.getByText("Today's Availability")).toBeVisible();

  await page.getByText("Book Now").first().click();
  await expect(page.getByText("Select Appointment")).toBeVisible();

  await page.getByText("Julian M.").click();
  await page.getByText("SAT").click();
  await page.getByText("19:30").click();
  await expect(page.getByText("with Julian M.")).toBeVisible();

  await page.getByText("Pay ₹22 & Confirm Booking").click();
  await expect(page.getByText("Booking Confirmed")).toBeVisible();

  await page.getByText("Services").last().click();
  await expect(page.getByText("Our Services", { exact: true }).first()).toBeVisible();
  await page.getByText("Grooming", { exact: true }).click();
  await expect(page.getByText("Beard Setting")).toBeVisible();
  await page.getByText("Premium", { exact: true }).click();
  await expect(page.getByText("L'Oreal Color")).toBeVisible();

  await page.getByText("Hair Straightening").click();
  await expect(page.getByText("Selected (3)")).toBeVisible();

  await page.getByLabel("Open profile").click();
  await expect(page.getByText("Amit Sharma")).toBeVisible();
  await page.getByText("Personal Info").click();
  await expect(page.getByText("Personal Info opened")).toBeVisible();
  await page.getByText("SIGN OUT").click();
  await expect(page.getByText("Signed out of this demo session")).toBeVisible();

  await page.getByLabel("Open services").click();
  await expect(page.getByText("Our Services", { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: "z:/Fahion Gents Parlour Godda/.snapshots/mobile-section-clickthrough.png" });
});
