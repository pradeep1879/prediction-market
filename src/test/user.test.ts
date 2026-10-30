
import { test, expect, describe } from "bun:test";
import axios from "axios";
import jwt from "jsonwebtoken";

const BACKEND_URL = "http://localhost:3005";

const api = axios.create({
  baseURL: BACKEND_URL,
  validateStatus: () => true,
});

// Use unique emails so tests can run repeatedly.
const createUser = () => ({
  email: `user-${crypto.randomUUID()}@example.com`,
  password: "StrongPassword123",
  balance: 1000,
});

describe("User Signup", () => {
  test("should signup a user with valid credentials", async () => {
    const user = createUser();

    const response = await api.post("/user/signup", user);

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.user.email).toBe(user.email);
    expect(response.data.user.id).toBeDefined();
  });

  test("should reject signup when email is missing", async () => {
    const response = await api.post("/user/signup", {
      password: "StrongPassword123",
      balance: 1000,
    });

    expect(response.status).toBe(400);
    expect(response.data.success).toBe(false);
  });

  test("should reject signup when password is missing", async () => {
    const response = await api.post("/user/signup", {
      email: createUser().email,
      balance: 1000,
    });

    expect(response.status).toBe(400);
    expect(response.data.success).toBe(false);
  });

  test("should reject signup when email is invalid", async () => {
    const response = await api.post("/user/signup", {
      email: "invalid-email",
      password: "StrongPassword123",
      balance: 1000,
    });

    expect(response.status).toBe(400);
    expect(response.data.success).toBe(false);
  });

  test("should reject signup when password is too short", async () => {
    const response = await api.post("/user/signup", {
      email: createUser().email,
      password: "123",
      balance: 1000,
    });

    expect(response.status).toBe(400);
    expect(response.data.success).toBe(false);
  });

  test("should reject signup when both email and password are missing", async () => {
    const response = await api.post("/user/signup", {});

    expect(response.status).toBe(400);
    expect(response.data.success).toBe(false);
  });

  test("should reject signup when email already exists", async () => {
    const user = createUser();

    const firstResponse = await api.post("/user/signup", user);
    expect(firstResponse.status).toBe(200);

    const secondResponse = await api.post("/user/signup", user);

    expect(secondResponse.status).toBe(400);
    expect(secondResponse.data.success).toBe(false);
    expect(secondResponse.data.message).toBe("User already exits");
  });
});

describe("User Signin", () => {
  test("should signin with valid credentials and return a JWT", async () => {
    const user = createUser();

    const signupResponse = await api.post("/user/signup", user);
    expect(signupResponse.status).toBe(200);

    const response = await api.post("/user/signin", {
      email: user.email,
      password: user.password,
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.token).toBeDefined();
    expect(typeof response.data.token).toBe("string");

    const decoded = jwt.verify(
      response.data.token,
      process.env.JWT_SECRET!,
    ) as jwt.JwtPayload;

    expect(decoded.userId).toBe(signupResponse.data.user.id);
  });


  test("should reject signin when both fields are missing", async () => {
    const response = await api.post("/user/signin", {});

    expect(response.status).toBe(400);
    expect(response.data.success).toBe(false);
  });

  test("should reject signin with an invalid email", async () => {
    const response = await api.post("/user/signin", {
      email: "not-an-email",
      password: "StrongPassword123",
    });

    expect(response.status).toBe(400);
    expect(response.data.success).toBe(false);
  });

  test("should reject signin for a nonexistent user", async () => {
    const response = await api.post("/user/signin", {
      email: `missing-${crypto.randomUUID()}@example.com`,
      password: "StrongPassword123",
    });

    expect(response.status).toBe(400);
    expect(response.data.success).toBe(false);
    expect(response.data.message).toBe("User does not exit");
  });
});
