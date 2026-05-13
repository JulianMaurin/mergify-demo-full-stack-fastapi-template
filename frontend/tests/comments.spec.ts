import { expect, test } from "@playwright/test"
import { createUser } from "./utils/privateApi"
import { randomEmail, randomItemTitle, randomPassword } from "./utils/random"
import { logInUser } from "./utils/user"

test.describe("Comments", () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  let email: string
  const password = randomPassword()

  test.beforeAll(async () => {
    email = randomEmail()
    await createUser({ email, password })
  })

  test.beforeEach(async ({ page }) => {
    await logInUser(page, email, password)
  })

  test("Post a comment and see it in the list", async ({ page }) => {
    const title = randomItemTitle()

    await page.goto("/items")
    await page.getByRole("button", { name: "Add Item" }).click()
    await page.getByLabel("Title").fill(title)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Item created successfully")).toBeVisible()

    await page.getByRole("link", { name: title }).click()
    await expect(page.getByRole("heading", { name: "Comments" })).toBeVisible()
    await expect(page.getByText("No comments yet. Be the first")).toBeVisible()

    const comment = `Hello from comment ${Math.random().toString(36).slice(2, 8)}`
    await page.getByPlaceholder("Write a comment...").fill(comment)
    await page.getByRole("button", { name: "Post" }).click()

    await expect(page.getByText(comment)).toBeVisible()
    await expect(page.getByText(email)).toBeVisible()
    await expect(
      page.getByText("No comments yet. Be the first"),
    ).not.toBeVisible()
  })

  test("Comment list shows multiple comments in order", async ({ page }) => {
    const title = randomItemTitle()

    await page.goto("/items")
    await page.getByRole("button", { name: "Add Item" }).click()
    await page.getByLabel("Title").fill(title)
    await page.getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Item created successfully")).toBeVisible()

    await page.getByRole("link", { name: title }).click()

    const first = "First comment"
    const second = "Second comment"
    await page.getByPlaceholder("Write a comment...").fill(first)
    await page.getByRole("button", { name: "Post" }).click()
    await expect(page.getByText(first)).toBeVisible()

    await page.getByPlaceholder("Write a comment...").fill(second)
    await page.getByRole("button", { name: "Post" }).click()
    await expect(page.getByText(second)).toBeVisible()

    const items = await page.getByRole("listitem").allTextContents()
    const firstIdx = items.findIndex((t) => t.includes(first))
    const secondIdx = items.findIndex((t) => t.includes(second))
    expect(secondIdx).toBeGreaterThan(-1)
    expect(firstIdx).toBeGreaterThan(secondIdx)
  })
})
