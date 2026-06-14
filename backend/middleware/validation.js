const Joi = require("joi");

const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: errorMessages
      });
    }
    next();
  };
};

// Joi Schemas
const signupSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.min": "Name must be at least 3 characters",
    "any.required": "Name is required"
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required"
  }),
  password: Joi.string().min(6).max(255).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required"
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required"
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required"
  })
});

const profileSchema = Joi.object({
  userId: Joi.number().integer().required(),
  departmentId: Joi.number().integer().required(),
  phone: Joi.string().max(20).required(),
  address: Joi.string().min(5).required(),
  designation: Joi.string().max(100).required(),
  salary: Joi.number().positive().required(),
  skills: Joi.array().items(Joi.number().integer()).optional(),
  images: Joi.array().items(Joi.string().uri()).max(5).optional()
});

const leaveApplicationSchema = Joi.object({
  leaveTypeId: Joi.number().integer().required(),
  fromDate: Joi.date().iso().required(),
  toDate: Joi.date().iso().greater(Joi.ref("fromDate")).required().messages({
    "date.greater": "End date must be after start date"
  }),
  reason: Joi.string().min(5).max(1000).required().messages({
    "string.min": "Reason must be at least 5 characters"
  })
});

const leaveApprovalSchema = Joi.object({
  action: Joi.string().valid("APPROVED", "REJECTED").required(),
  remarks: Joi.string().max(500).optional().allow("")
});

module.exports = {
  validateBody,
  signupSchema,
  loginSchema,
  profileSchema,
  leaveApplicationSchema,
  leaveApprovalSchema
};
