import { render, screen } from "@testing-library/react";
import { postRegisterForm } from "./api";

test("should call the addUser API and set cookies", async () => {
  const finalValues = {
    email: "test@example.com",
    firstName: "John",
  };

  // Mock the fetch function
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      status: 200,
      json: () => Promise.resolve({ success: true }),
    }),
  );

  // Call the function
  const response = await postRegisterForm(finalValues);

  // Check if the addUser API was called with the correct parameters
  expect(fetch).toHaveBeenCalledWith("http://localhost:8000/add", {
    method: "POST",
    body: JSON.stringify(finalValues),
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Check if the setLogin function was called with the correct parameters
  expect(cookies.get("email")).toBe(finalValues.email);
  expect(cookies.get("firstName")).toBe(finalValues.firstName);

  // Check if the response is correct
  expect(response).toEqual({ success: true });
});
