import assert from "node:assert/strict";
import { test } from "node:test";
import { validateLogin, validateRegistration } from "./authValidation.ts";

test("login allows an existing short password without applying registration rules", () => {
  assert.deepEqual(
    validateLogin({ email: "a@example.com", password: "old" }),
    {},
  );
  assert.ok(validateLogin({ email: "bad", password: "" }).email);
  assert.ok(validateLogin({ email: "a@example.com", password: "" }).password);
});

test("registration enforces every DTO field and accepts a one-character full name", () => {
  const valid = {
    email: "a@example.com",
    username: "anna",
    fullName: "A",
    password: "Fitwork@123",
    userType: "APPLICANT" as const,
  };
  assert.deepEqual(validateRegistration(valid), {});
  for (const password of [
    "Aa1!",
    "FITWORK@123",
    "fitwork@123",
    "Fitwork@abc",
    "Fitwork123",
  ]) {
    assert.ok(validateRegistration({ ...valid, password }).password);
  }
  assert.ok(validateRegistration({ ...valid, username: "aa" }).username);
  assert.ok(validateRegistration({ ...valid, fullName: " " }).fullName);
  assert.ok(validateRegistration({ ...valid, email: "bad" }).email);
  assert.deepEqual(validateRegistration({ ...valid, userType: "COMPANY" }), {});
});
