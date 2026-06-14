const swaggerUi = require("swagger-ui-express");

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Employee Management System API",
    version: "1.0.0",
    description: "Enterprise EMS full-stack API documentation featuring rates-limits, JWT security, custom rate limits, Multi-level Leave Workflow, and SQL Report Sandboxes."
  },
  servers: [
    {
      url: "http://localhost:5000/api",
      description: "Local Development Server"
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ],
  paths: {
    "/auth/signup": {
      post: {
        summary: "User Registration",
        description: "Registers a user account. Email verification link is printed in backend terminal logs.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string" }
                },
                required: ["name", "email", "password"]
              }
            }
          }
        },
        responses: {
          201: { description: "User Registered" },
          400: { description: "Email already exists / validation failed" }
        }
      }
    },
    "/auth/login": {
      post: {
        summary: "User Authentication",
        description: "Authenticates credentials and returns access + refresh tokens.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  password: { type: "string" }
                },
                required: ["email", "password"]
              }
            }
          }
        },
        responses: {
          200: { description: "Authentication tokens returned" },
          400: { description: "Wrong credentials / Unverified account" }
        }
      }
    },
    "/user/profile": {
      get: {
        summary: "Get current user profile Details",
        responses: {
          200: { description: "Profile data fetched successfully" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/employees": {
      get: {
        summary: "List all Employee profiles (Includes joins)",
        responses: {
          200: { description: "Profiles array" }
        }
      },
      post: {
        summary: "Create Employee profile",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: { type: "integer" },
                  departmentId: { type: "integer" },
                  phone: { type: "string" },
                  address: { type: "string" },
                  designation: { type: "string" },
                  salary: { type: "number" },
                  skills: { type: "array", items: { type: "integer" } },
                  images: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Profile created" }
        }
      }
    },
    "/leaves": {
      get: {
        summary: "List active leave requests for current user",
        responses: {
          200: { description: "Leaves array" }
        }
      },
      post: {
        summary: "Submit a Leave application",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  leaveTypeId: { type: "integer" },
                  fromDate: { type: "string" },
                  toDate: { type: "string" },
                  reason: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Leave request submitted" }
        }
      }
    },
    "/leaves/{id}/approve": {
      post: {
        summary: "Approve or Reject leave request (Multi-level)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  action: { type: "string", enum: ["APPROVED", "REJECTED"] },
                  remarks: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Leave action recorded successfully" },
          400: { description: "Insufficient leave balance / Transaction abort" }
        }
      }
    },
    "/reports/stats": {
      get: {
        summary: "Get overall dashboard stats counters",
        responses: {
          200: { description: "Employees, departments, leaves, approvals counts" }
        }
      }
    },
    "/reports/sql-sandbox": {
      get: {
        summary: "Runs raw advanced SQL queries (DENSE_RANK, GROUP BY, aggregates)",
        responses: {
          200: { description: "Advanced postgres results" }
        }
      }
    }
  }
};

module.exports = {
  swaggerUi,
  swaggerDocument
};
